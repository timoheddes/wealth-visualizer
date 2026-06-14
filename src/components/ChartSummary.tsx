import {
  formatCurrency,
  formatDate,
  getChartEndpointSummary,
} from "@/lib/wealth-calculations";
import type { Currency, Mutation, Source, TimeRange } from "@/types/wealth";
import { useMemo } from "react";

interface ChartSummaryProps {
  sources: Source[];
  mutations: Mutation[];
  range: TimeRange;
  currency: Currency;
}

export function ChartSummary({
  sources,
  mutations,
  range,
  currency,
}: ChartSummaryProps) {
  const summary = useMemo(
    () => getChartEndpointSummary(sources, mutations, range),
    [sources, mutations, range],
  );

  if (!summary) return null;

  return (
    <div className="border-t pt-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        End of range · {formatDate(summary.date)}
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {summary.sources.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <dt className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="truncate">{entry.label}</span>
            </dt>
            <dd className="text-foreground shrink-0 font-mono text-sm font-medium tabular-nums">
              {formatCurrency(entry.displayValue, currency)}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2 sm:col-span-2 lg:col-span-3">
          <dt className="text-foreground text-sm font-medium">Total</dt>
          <dd className="text-foreground font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(summary.total, currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
