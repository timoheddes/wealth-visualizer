import {
  addDays,
  differenceInCalendarDays,
  eachMonthOfInterval,
  endOfMonth,
  isAfter,
  isBefore,
  max,
  min,
  startOfMonth,
} from "date-fns";
import type { ChartPoint, Mutation, Source, TimeRange } from "@/types/wealth";
import { isLiabilitySource } from "@/types/wealth";

const DAYS_PER_YEAR = 365.25;

function toTimestamp(date: Date): number {
  return date.getTime();
}

function growthMultiplier(growthPercent: number, days: number): number {
  if (days <= 0) return 1;
  const annualRate = growthPercent / 100;
  return Math.pow(1 + annualRate, days / DAYS_PER_YEAR);
}

/** Value of a single source at a given date, before mutations. */
export function sourceValueAt(source: Source, date: Date): number {
  if (isBefore(date, source.initialDate)) return 0;
  if (isAfter(date, source.endDate)) return 0;

  const days = differenceInCalendarDays(date, source.initialDate);
  return source.initialValue * growthMultiplier(source.growth, days);
}

/** How a source value contributes to net-worth total (debts subtract). */
export function sourceContributionToTotal(
  source: Source,
  value: number,
): number {
  return isLiabilitySource(source.type) ? -value : value;
}

/** All occurrence dates for a mutation on or before the given date. */
function mutationOccurrenceDatesUpTo(mutation: Mutation, date: Date): Date[] {
  if (isBefore(date, mutation.date)) return [];

  if (mutation.type === "once") return [mutation.date];

  if (mutation.frequency <= 0) return [];

  const effectiveEnd = mutation.endDate
    ? min([mutation.endDate, date])
    : date;

  const dates: Date[] = [];
  let current = mutation.date;
  while (!isAfter(current, effectiveEnd)) {
    dates.push(current);
    current = addDays(current, mutation.frequency);
  }
  return dates;
}

/** Value of a mutation amount compounded from its occurrence date. */
function compoundedMutationValue(
  amount: number,
  occurrenceDate: Date,
  source: Source,
  date: Date,
  mutationType: Mutation["type"],
): number {
  if (isAfter(date, source.endDate)) return 0;
  if (isBefore(date, occurrenceDate)) return 0;

  // One-off withdrawals stay flat; deposits and recurring flows compound.
  if (mutationType === "once" && amount < 0) {
    return amount;
  }

  const growthEnd = min([date, source.endDate]);
  const days = differenceInCalendarDays(growthEnd, occurrenceDate);
  if (days < 0) return 0;

  return amount * growthMultiplier(source.growth, days);
}

const LIQUIDATION_THRESHOLD = 0.9;

/** Date when a source is fully sold off via a large one-off withdrawal. */
function getLiquidationDate(
  source: Source,
  sourceMutations: Mutation[],
): Date | null {
  let earliest: Date | null = null;

  for (const mutation of sourceMutations) {
    if (mutation.type !== "once" || mutation.value >= 0) continue;

    const valueBefore = sourceValueWithSourceMutations(
      source,
      sourceMutations,
      mutation.date,
      mutation.id,
      true,
    );
    if (valueBefore <= 0) continue;

    if (Math.abs(mutation.value) >= valueBefore * LIQUIDATION_THRESHOLD) {
      if (!earliest || isBefore(mutation.date, earliest)) {
        earliest = mutation.date;
      }
    }
  }

  return earliest;
}

function sourceMutationsFor(
  source: Source,
  mutations: Mutation[],
): Mutation[] {
  return mutations.filter(
    (m) => m.target === "source" && m.sourceId === source.id,
  );
}

function isSourceInactive(
  source: Source,
  sourceMutations: Mutation[],
  date: Date,
): boolean {
  if (isAfter(date, source.endDate)) return true;

  const liquidationDate = getLiquidationDate(source, sourceMutations);
  return liquidationDate != null && isAfter(date, liquidationDate);
}

/** Source value from base growth and source-targeted mutations only. */
function sourceValueWithSourceMutations(
  source: Source,
  mutations: Mutation[],
  date: Date,
  excludeMutationId?: string,
  skipInactiveCheck = false,
): number {
  if (isBefore(date, source.initialDate)) return 0;
  if (isAfter(date, source.endDate)) return 0;

  const sourceMutations = sourceMutationsFor(source, mutations);

  if (!skipInactiveCheck && isSourceInactive(source, sourceMutations, date)) {
    return 0;
  }

  const applicableMutations = sourceMutations.filter(
    (m) => m.id !== excludeMutationId,
  );

  const base = sourceValueAt(source, date);

  const mutationTotal = applicableMutations.reduce((sum, mutation) => {
    const occurrences = mutationOccurrenceDatesUpTo(mutation, date);
    return (
      sum +
      occurrences.reduce(
        (occSum, occurrenceDate) =>
          occSum +
          compoundedMutationValue(
            mutation.value,
            occurrenceDate,
            source,
            date,
            mutation.type,
          ),
        0,
      )
    );
  }, 0);

  return base + mutationTotal;
}

function portfolioWeightAt(
  source: Source,
  sources: Source[],
  sourceMutations: Mutation[],
  date: Date,
): number {
  const weights = sources.map((s) => {
    if (isLiabilitySource(s.type)) return 0;
    return Math.max(0, sourceValueWithSourceMutations(s, sourceMutations, date));
  });
  const portfolio = weights.reduce((sum, weight) => sum + weight, 0);

  if (portfolio <= 0) {
    const assetSources = sources.filter((s) => !isLiabilitySource(s.type));
    if (assetSources.length === 0) return 1 / sources.length;
    const assetIndex = assetSources.findIndex((s) => s.id === source.id);
    if (assetIndex < 0) return 0;
    return 1 / assetSources.length;
  }

  const sourceIndex = sources.findIndex((s) => s.id === source.id);
  return weights[sourceIndex] / portfolio;
}

/** Allocate total-targeted mutations across sources by portfolio share. */
function allocatedTotalMutationsValue(
  source: Source,
  sources: Source[],
  mutations: Mutation[],
  date: Date,
): number {
  const sourceMutations = sourceMutationsFor(source, mutations);
  if (isSourceInactive(source, sourceMutations, date)) return 0;

  const allSourceMutations = mutations.filter((m) => m.target === "source");
  const totalMutations = mutations.filter((m) => m.target === "total");

  return totalMutations.reduce((sum, mutation) => {
    const occurrences = mutationOccurrenceDatesUpTo(mutation, date);
    return (
      sum +
      occurrences.reduce((occSum, occurrenceDate) => {
        const share = portfolioWeightAt(
          source,
          sources,
          allSourceMutations,
          occurrenceDate,
        );
        return (
          occSum +
          compoundedMutationValue(
            mutation.value * share,
            occurrenceDate,
            source,
            date,
            mutation.type,
          )
        );
      }, 0)
    );
  }, 0);
}

/** Source value including source and allocated total-targeted mutations. */
export function sourceValueWithMutations(
  source: Source,
  sources: Source[],
  mutations: Mutation[],
  date: Date,
): number {
  const sourceMutations = sourceMutationsFor(source, mutations);
  if (isSourceInactive(source, sourceMutations, date)) return 0;

  return (
    sourceValueWithSourceMutations(source, mutations, date) +
    allocatedTotalMutationsValue(source, sources, mutations, date)
  );
}

/** All occurrence dates for a mutation within an inclusive date window. */
export function expandMutationOccurrences(
  mutation: Mutation,
  window: TimeRange,
): Date[] {
  return mutationOccurrenceDatesUpTo(mutation, window.end).filter(
    (occurrenceDate) =>
      !isBefore(occurrenceDate, window.start) &&
      !isAfter(occurrenceDate, window.end),
  );
}

/** Combined net-worth total across all sources. */
export function totalValueWithMutations(
  sources: Source[],
  mutations: Mutation[],
  date: Date,
): number {
  return sources.reduce(
    (sum, source) =>
      sum +
      sourceContributionToTotal(
        source,
        sourceValueWithMutations(source, sources, mutations, date),
      ),
    0,
  );
}

export function getDataBounds(
  sources: Source[],
  mutations: Mutation[] = [],
): TimeRange | null {
  if (sources.length === 0) return null;

  const dates: Date[] = [];

  for (const source of sources) {
    dates.push(source.initialDate, source.endDate);
  }

  for (const mutation of mutations) {
    dates.push(mutation.date);
    if (mutation.endDate) {
      dates.push(mutation.endDate);
    }
  }

  return {
    start: min(dates),
    end: max(dates),
  };
}

export function buildChartData(
  sources: Source[],
  mutations: Mutation[],
  range: TimeRange,
): ChartPoint[] {
  const months = eachMonthOfInterval({
    start: startOfMonth(range.start),
    end: endOfMonth(range.end),
  });

  return months.map((month) => {
    const pointDate = min([endOfMonth(month), range.end]);
    const point: ChartPoint = {
      date: pointDate,
      timestamp: toTimestamp(pointDate),
    };

    let sourcesTotal = 0;
    for (const source of sources) {
      const value = sourceValueWithMutations(
        source,
        sources,
        mutations,
        pointDate,
      );
      point[source.id] = value;
      sourcesTotal += sourceContributionToTotal(source, value);
    }
    point.total = sourcesTotal;

    return point;
  });
}

export interface MutationMarker {
  id: string;
  mutation: Mutation;
  source: Source | null;
  date: Date;
  timestamp: number;
  y: number;
}

/** Collect mutation occurrence markers for chart dots within the visible range. */
export function getMutationMarkers(
  sources: Source[],
  mutations: Mutation[],
  range: TimeRange,
): MutationMarker[] {
  const markers: MutationMarker[] = [];

  for (const mutation of mutations) {
    if (mutation.type !== "once") continue;

    if (mutation.target === "source") {
      const source = sources.find((s) => s.id === mutation.sourceId);
      if (!source) continue;

      const occurrences = expandMutationOccurrences(mutation, range);
      for (const date of occurrences) {
        markers.push({
          id: `${mutation.id}-${date.getTime()}`,
          mutation,
          source,
          date,
          timestamp: date.getTime(),
          y: sourceValueWithMutations(source, sources, mutations, date),
        });
      }
      continue;
    }

    const occurrences = expandMutationOccurrences(mutation, range);
    for (const date of occurrences) {
      markers.push({
        id: `${mutation.id}-${date.getTime()}`,
        mutation,
        source: null,
        date,
        timestamp: date.getTime(),
        y: totalValueWithMutations(sources, mutations, date),
      });
    }
  }

  return markers;
}

import type { Currency } from "@/types/wealth";
import { CURRENCY_LOCALES } from "@/types/wealth";

export function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function parseDateInput(value: string): Date {
  return new Date(value + "T12:00:00");
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function clampRange(
  range: TimeRange,
  bounds: TimeRange,
): TimeRange {
  return {
    start: max([range.start, bounds.start]),
    end: min([range.end, bounds.end]),
  };
}

export function rangeToSliderValues(
  range: TimeRange,
  bounds: TimeRange,
): [number, number] {
  const totalSpan = bounds.end.getTime() - bounds.start.getTime();
  if (totalSpan <= 0) return [0, 100];

  const startPct =
    ((range.start.getTime() - bounds.start.getTime()) / totalSpan) * 100;
  const endPct =
    ((range.end.getTime() - bounds.start.getTime()) / totalSpan) * 100;
  return [startPct, endPct];
}

export function sliderValuesToRange(
  values: [number, number],
  bounds: TimeRange,
): TimeRange {
  const totalSpan = bounds.end.getTime() - bounds.start.getTime();
  const start = new Date(bounds.start.getTime() + (values[0] / 100) * totalSpan);
  const end = new Date(bounds.start.getTime() + (values[1] / 100) * totalSpan);
  return { start, end };
}
