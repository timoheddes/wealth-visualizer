export type WealthType = "investment" | "cash" | "property";

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
  sourceId: string;
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
};

export const DEFAULT_GROWTH_BY_TYPE: Record<WealthType, number> = {
  investment: 8,
  cash: 0,
  property: 5,
};

export const DEFAULT_SOURCE_COLORS = [
  "#4c6ef5",
  "#12b886",
  "#fd7e14",
  "#be4bdb",
  "#e03131",
] as const;

export function getDefaultSourceColor(index: number): string {
  return DEFAULT_SOURCE_COLORS[index % DEFAULT_SOURCE_COLORS.length];
}
