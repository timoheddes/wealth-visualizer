export type WealthType =
  | "investment"
  | "cash"
  | "property"
  | "pension"
  | "depreciating"
  | "debt";

/** Display order for type selectors */
export const WEALTH_TYPES: WealthType[] = [
  "investment",
  "cash",
  "property",
  "pension",
  "depreciating",
  "debt",
];

export type Currency = "USD" | "EUR" | "GBP";

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "US Dollar ($)",
  EUR: "Euro (€)",
  GBP: "British Pound (£)",
};

export const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

export interface Source {
  id: string;
  type: WealthType;
  label: string;
  color: string;
  initialValue: number;
  initialDate: Date;
  endDate: Date;
  /** Annual growth rate as a percentage (e.g. 7 = 7% per year) */
  growth: number;
}

export interface Mutation {
  id: string;
  target: MutationTarget;
  /** Set when target is "source"; null for total mutations */
  sourceId: string | null;
  value: number;
  label: string;
  /** Start date for recurring mutations; the single occurrence date for one-off */
  date: Date;
  type: MutationType;
  /** Interval in days between recurring occurrences */
  frequency: number;
  /** Optional end date for recurring mutations */
  endDate: Date | null;
  color: string;
}

export type MutationTarget = "source" | "total";

export const MUTATION_TARGET_LABELS: Record<MutationTarget, string> = {
  source: "Source",
  total: "Total",
};

export const TOTAL_MUTATION_APPLIES_TO = "total" as const;

export type MutationType = "once" | "recurring";

export const MUTATION_TYPE_LABELS: Record<MutationType, string> = {
  once: "One-off",
  recurring: "Recurring",
};

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ChartPoint {
  date: Date;
  timestamp: number;
  [key: string]: number | Date;
}

export const WEALTH_TYPE_LABELS: Record<WealthType, string> = {
  investment: "Investment",
  cash: "Cash",
  property: "Property",
  pension: "Pension",
  depreciating: "Depreciating asset",
  debt: "Debt",
};

export const DEFAULT_GROWTH_BY_TYPE: Record<WealthType, number> = {
  investment: 8,
  cash: 0,
  property: 5,
  pension: 6,
  depreciating: -12,
  debt: 4,
};

export const WEALTH_TYPE_INITIAL_VALUE_LABELS: Record<WealthType, string> = {
  investment: "Initial value",
  cash: "Initial value",
  property: "Initial value",
  pension: "Current balance",
  depreciating: "Current value",
  debt: "Balance owed",
};

export function isLiabilitySource(type: WealthType): boolean {
  return type === "debt";
}

export const DEFAULT_SOURCE_COLORS = [
  "#04151f",
  "#183a37",
  "#efd6ac",
  "#c44900",
  "#432534",
  "#7c6a0a",
  "#babd8d",
  "#ffdac6",
  "#fa9500",
  "#eb6424"
] as const;

export function getDefaultSourceColor(index: number): string {
  return DEFAULT_SOURCE_COLORS[index % DEFAULT_SOURCE_COLORS.length];
}
