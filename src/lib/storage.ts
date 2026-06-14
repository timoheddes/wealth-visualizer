import type { MutationLinkGroup } from "@/lib/mutation-links";
import { sanitizeLinkGroups } from "@/lib/mutation-links";
import type {
  Currency,
  Mutation,
  MutationTarget,
  MutationType,
  Source,
  TimeRange,
  WealthType,
} from "@/types/wealth";
import { getDefaultSourceColor } from "@/types/wealth";

const STORAGE_KEY = "wealth-visualizer";
const STORAGE_VERSION = 5;

interface StoredSource {
  id: string;
  type: WealthType;
  label: string;
  color: string;
  initialValue: number;
  initialDate: string;
  endDate: string;
  growth: number;
}

interface StoredMutation {
  id: string;
  sourceId: string | null;
  value: number;
  label: string;
  date: string;
  target?: MutationTarget;
  type?: MutationType;
  frequency?: number;
  endDate?: string | null;
  color?: string;
}

interface StoredTimeRange {
  start: string;
  end: string;
}

interface StoredMutationLinkGroup {
  id: string;
  mutationIds: string[];
}

interface StoredAppState {
  version: number;
  currency: Currency;
  sources: StoredSource[];
  mutations: StoredMutation[];
  range: StoredTimeRange | null;
  mutationLinkGroups?: StoredMutationLinkGroup[];
  enabledSourceIds?: string[];
  enabledMutationIds?: string[];
}

export interface AppState {
  currency: Currency;
  sources: Source[];
  mutations: Mutation[];
  range: TimeRange | null;
  mutationLinkGroups: MutationLinkGroup[];
  enabledSourceIds: string[];
  enabledMutationIds: string[];
}

const DEFAULT_APP_STATE: AppState = {
  currency: "EUR",
  sources: [],
  mutations: [],
  range: null,
  mutationLinkGroups: [],
  enabledSourceIds: [],
  enabledMutationIds: [],
};

const VALID_CURRENCIES = new Set<Currency>(["USD", "EUR", "GBP"]);
const VALID_WEALTH_TYPES = new Set<WealthType>([
  "investment",
  "cash",
  "property",
  "pension",
  "depreciating",
  "debt",
]);
const VALID_MUTATION_TYPES = new Set<MutationType>(["once", "recurring"]);
const VALID_MUTATION_TARGETS = new Set<MutationTarget>(["source", "total"]);

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isStoredSource(value: unknown): value is StoredSource {
  if (!value || typeof value !== "object") return false;
  const s = value as StoredSource;
  return (
    typeof s.id === "string" &&
    VALID_WEALTH_TYPES.has(s.type) &&
    typeof s.label === "string" &&
    typeof s.color === "string" &&
    typeof s.initialValue === "number" &&
    typeof s.initialDate === "string" &&
    typeof s.endDate === "string" &&
    typeof s.growth === "number"
  );
}

function isStoredMutation(value: unknown): value is StoredMutation {
  if (!value || typeof value !== "object") return false;
  const m = value as StoredMutation;
  return (
    typeof m.id === "string" &&
    (typeof m.sourceId === "string" || m.sourceId === null) &&
    typeof m.value === "number" &&
    typeof m.label === "string" &&
    typeof m.date === "string"
  );
}

function toSource(stored: StoredSource): Source | null {
  const initialDate = parseDate(stored.initialDate);
  const endDate = parseDate(stored.endDate);
  if (!initialDate || !endDate) return null;
  return { ...stored, initialDate, endDate };
}

function toMutation(
  stored: StoredMutation,
  sources: Source[],
): Mutation | null {
  const date = parseDate(stored.date);
  if (!date) return null;

  const target: MutationTarget =
    stored.target && VALID_MUTATION_TARGETS.has(stored.target)
      ? stored.target
      : stored.sourceId === null
        ? "total"
        : "source";

  const source =
    stored.sourceId != null
      ? sources.find((s) => s.id === stored.sourceId)
      : undefined;

  if (target === "source" && !source) return null;

  const type =
    stored.type && VALID_MUTATION_TYPES.has(stored.type)
      ? stored.type
      : "once";
  const endDate =
    stored.endDate != null && stored.endDate !== ""
      ? parseDate(stored.endDate)
      : null;

  return {
    id: stored.id,
    target,
    sourceId: target === "total" ? null : stored.sourceId,
    value: stored.value,
    label: stored.label,
    date,
    type,
    frequency: stored.frequency ?? 0,
    endDate,
    color:
      stored.color ??
      source?.color ??
      getDefaultSourceColor(0),
  };
}

function toTimeRange(stored: StoredTimeRange | null): TimeRange | null {
  if (!stored) return null;
  const start = parseDate(stored.start);
  const end = parseDate(stored.end);
  if (!start || !end || start >= end) return null;
  return { start, end };
}

function serializeSource(source: Source): StoredSource {
  return {
    id: source.id,
    type: source.type,
    label: source.label,
    color: source.color,
    initialValue: source.initialValue,
    initialDate: source.initialDate.toISOString(),
    endDate: source.endDate.toISOString(),
    growth: source.growth,
  };
}

function serializeMutation(mutation: Mutation): StoredMutation {
  return {
    id: mutation.id,
    target: mutation.target,
    sourceId: mutation.sourceId,
    value: mutation.value,
    label: mutation.label,
    date: mutation.date.toISOString(),
    type: mutation.type,
    frequency: mutation.frequency,
    endDate: mutation.endDate?.toISOString() ?? null,
    color: mutation.color,
  };
}

function serializeTimeRange(range: TimeRange | null): StoredTimeRange | null {
  if (!range) return null;
  return {
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  };
}

export function sanitizeEnabledIds(
  ids: unknown,
  validIds: Set<string>,
  defaultToAll: boolean,
): string[] {
  if (!Array.isArray(ids)) {
    return defaultToAll ? [...validIds] : [];
  }

  return ids.filter(
    (id): id is string => typeof id === "string" && validIds.has(id),
  );
}

export function parseStoredPayload(parsed: unknown): AppState | null {
  if (!parsed || typeof parsed !== "object") return null;

  const stored = parsed as Partial<StoredAppState>;
  if (
    stored.version !== 1 &&
    stored.version !== 2 &&
    stored.version !== STORAGE_VERSION
  ) {
    return null;
  }

  const currency = VALID_CURRENCIES.has(stored.currency as Currency)
    ? (stored.currency as Currency)
    : DEFAULT_APP_STATE.currency;

  const sources = (stored.sources ?? [])
    .filter(isStoredSource)
    .map(toSource)
    .filter((s): s is Source => s !== null);

  const mutations = (stored.mutations ?? [])
    .filter(isStoredMutation)
    .map((m) => toMutation(m, sources))
    .filter((m): m is Mutation => m !== null);

  const range = toTimeRange(stored.range ?? null);
  const mutationIds = new Set(mutations.map((mutation) => mutation.id));
  const mutationLinkGroups = sanitizeLinkGroups(
    stored.mutationLinkGroups,
    mutationIds,
  );

  const sourceIds = new Set(sources.map((source) => source.id));
  const hasStoredVisibility =
    stored.version === STORAGE_VERSION &&
    (stored.enabledSourceIds != null || stored.enabledMutationIds != null);
  const enabledSourceIds = sanitizeEnabledIds(
    stored.enabledSourceIds,
    sourceIds,
    !hasStoredVisibility,
  );
  const enabledMutationIds = sanitizeEnabledIds(
    stored.enabledMutationIds,
    mutationIds,
    !hasStoredVisibility,
  );

  return {
    currency,
    sources,
    mutations,
    range,
    mutationLinkGroups,
    enabledSourceIds,
    enabledMutationIds,
  };
}

export function toStoredPayload(state: AppState): StoredAppState {
  return {
    version: STORAGE_VERSION,
    currency: state.currency,
    sources: state.sources.map(serializeSource),
    mutations: state.mutations.map(serializeMutation),
    range: serializeTimeRange(state.range),
    mutationLinkGroups: state.mutationLinkGroups,
    enabledSourceIds: state.enabledSourceIds,
    enabledMutationIds: state.enabledMutationIds,
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_STATE;

    return parseStoredPayload(JSON.parse(raw)) ?? DEFAULT_APP_STATE;
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export function saveAppState(state: AppState): void {
  const stored = toStoredPayload(state);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}
