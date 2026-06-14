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

  const growthEnd = min([date, source.endDate]);
  const days = differenceInCalendarDays(growthEnd, source.initialDate);
  return source.initialValue * growthMultiplier(source.growth, days);
}

/** Count how many times a mutation has occurred on or before a date. */
export function mutationOccurrencesUpTo(mutation: Mutation, date: Date): number {
  if (isBefore(date, mutation.date)) return 0;

  if (mutation.type === "once") return 1;

  if (mutation.frequency <= 0) return 0;

  const effectiveEnd = mutation.endDate
    ? min([mutation.endDate, date])
    : date;

  let count = 0;
  let current = mutation.date;
  while (!isAfter(current, effectiveEnd)) {
    count++;
    current = addDays(current, mutation.frequency);
  }
  return count;
}

/** All occurrence dates for a mutation within an inclusive date window. */
export function expandMutationOccurrences(
  mutation: Mutation,
  window: TimeRange,
): Date[] {
  if (mutation.type === "once") {
    if (
      !isBefore(mutation.date, window.start) &&
      !isAfter(mutation.date, window.end)
    ) {
      return [mutation.date];
    }
    return [];
  }

  if (mutation.frequency <= 0) return [];

  const absoluteEnd = mutation.endDate ?? window.end;
  const effectiveEnd = min([absoluteEnd, window.end]);
  const dates: Date[] = [];
  let current = mutation.date;

  while (!isAfter(current, effectiveEnd)) {
    if (!isBefore(current, window.start)) {
      dates.push(current);
    }
    current = addDays(current, mutation.frequency);
  }

  return dates;
}

/** Source value including applied mutations up to the given date. */
export function sourceValueWithMutations(
  source: Source,
  mutations: Mutation[],
  date: Date,
): number {
  const base = sourceValueAt(source, date);
  const mutationSum = mutations
    .filter((m) => m.sourceId === source.id)
    .reduce(
      (sum, m) => sum + m.value * mutationOccurrencesUpTo(m, date),
      0,
    );
  return base + mutationSum;
}

export function getDataBounds(sources: Source[]): TimeRange | null {
  if (sources.length === 0) return null;

  const start = min(sources.map((s) => s.initialDate));
  const end = max(sources.map((s) => s.endDate));
  return { start, end };
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
    const pointDate = endOfMonth(month);
    const point: ChartPoint = {
      date: pointDate,
      timestamp: toTimestamp(pointDate),
    };

    let total = 0;
    for (const source of sources) {
      const value = sourceValueWithMutations(source, mutations, pointDate);
      point[source.id] = value;
      total += value;
    }
    point.total = total;

    return point;
  });
}

export interface MutationMarker {
  id: string;
  mutation: Mutation;
  source: Source;
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
        y: sourceValueWithMutations(source, mutations, date),
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
