import {
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  buildChartData,
  formatCurrency,
  formatDate,
  formatShortDate,
  getMutationMarkers,
} from "@/lib/wealth-calculations";
import type { ChartPoint, Currency, Mutation, Source, TimeRange } from "@/types/wealth";
import { isLiabilitySource, MUTATION_TYPE_LABELS } from "@/types/wealth";
import { useMemo } from "react";

interface WealthChartProps {
  sources: Source[];
  mutations: Mutation[];
  range: TimeRange;
  currency: Currency;
}

type IndexedChartPoint = ChartPoint & { monthIndex: number };

interface MutationDot {
  id: string;
  monthIndex: number;
  timestamp: number;
  y: number;
  mutationLabel: string;
  mutationValue: number;
  mutationType: string;
  color: string;
}

function subsampleMonthTickIndices(length: number, tickCount = 4): number[] {
  if (length <= tickCount) {
    return Array.from({ length }, (_, index) => index);
  }

  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(Math.round((i / (tickCount - 1)) * (length - 1)));
  }
  return ticks;
}

function monthIndexForTimestamp(
  chartData: IndexedChartPoint[],
  timestamp: number,
): number {
  let closestIndex = 0;
  let closestDistance = Infinity;

  for (let index = 0; index < chartData.length; index++) {
    const distance = Math.abs(chartData[index].timestamp - timestamp);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

function mutationLineKey(sourceId: string | null): string {
  return sourceId == null ? "total" : `source:${sourceId}`;
}

function createMutationDotRenderer(dots: MutationDot[]) {
  const dotsByMonth = new Map<number, MutationDot[]>();
  for (const dot of dots) {
    const monthDots = dotsByMonth.get(dot.monthIndex) ?? [];
    monthDots.push(dot);
    dotsByMonth.set(dot.monthIndex, monthDots);
  }

  return (props: {
    cx?: number;
    cy?: number;
    payload?: IndexedChartPoint;
  }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || payload == null) return <g />;

    const monthDots = dotsByMonth.get(payload.monthIndex);
    if (!monthDots?.length) return <g />;

    return (
      <g>
        {monthDots.map((dot) => (
          <circle
            key={dot.id}
            cx={cx}
            cy={cy}
            r={5}
            fill={dot.color}
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}
      </g>
    );
  };
}

export function WealthChart({
  sources,
  mutations,
  range,
  currency,
}: WealthChartProps) {
  const chartData = useMemo(
    (): IndexedChartPoint[] =>
      buildChartData(sources, mutations, range).map((point, monthIndex) => ({
        ...point,
        monthIndex,
      })),
    [sources, mutations, range],
  );

  const markers = getMutationMarkers(sources, mutations, range);

  const mutationsByLine = useMemo(() => {
    const map = new Map<string, MutationDot[]>();

    for (const marker of markers) {
      const lineKey = mutationLineKey(marker.source?.id ?? null);
      const dot: MutationDot = {
        id: marker.id,
        monthIndex: monthIndexForTimestamp(chartData, marker.timestamp),
        timestamp: marker.timestamp,
        y: marker.y,
        mutationLabel: marker.mutation.label,
        mutationValue: marker.mutation.value,
        mutationType: MUTATION_TYPE_LABELS[marker.mutation.type],
        color: marker.mutation.color,
      };

      const lineDots = map.get(lineKey) ?? [];
      lineDots.push(dot);
      map.set(lineKey, lineDots);
    }

    return map;
  }, [markers, chartData]);

  const liabilitySourceIds = useMemo(
    () =>
      new Set(
        sources
          .filter((source) => isLiabilitySource(source.type))
          .map((source) => source.id),
      ),
    [sources],
  );

  const xTicks = useMemo(
    () => subsampleMonthTickIndices(chartData.length),
    [chartData.length],
  );

  const chartConfig: ChartConfig = {
    total: {
      label: "Total",
      color: "var(--foreground)",
    },
    ...Object.fromEntries(
      sources.map((source) => [
        source.id,
        {
          label: source.label,
          color: source.color,
        },
      ]),
    ),
  };

  if (sources.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed text-sm">
        Add wealth sources to see the projection chart.
      </div>
    );
  }

  const axisId = "wealth";
  const xDomain: [number, number] = [0, Math.max(chartData.length - 1, 0)];

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <ComposedChart
        data={chartData}
        margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          xAxisId={axisId}
          dataKey="monthIndex"
          type="number"
          domain={xDomain}
          ticks={xTicks}
          allowDecimals={false}
          allowDataOverflow
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(monthIndex) => {
            const point = chartData[Number(monthIndex)];
            return point ? formatDate(point.date as Date) : "";
          }}
        />
        <YAxis
          yAxisId={axisId}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => formatCurrency(v, currency)}
          width={80}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;

            const monthIndex = Number(payload[0]?.payload?.monthIndex);
            const lineKey = mutationLineKey(
              payload[0]?.dataKey === "total"
                ? null
                : String(payload[0]?.dataKey ?? ""),
            );
            const mutationDot = (mutationsByLine.get(lineKey) ?? []).find(
              (dot) => dot.monthIndex === monthIndex,
            );

            if (mutationDot) {
              return (
                <div className="border-border/50 bg-background grid min-w-[8rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                  <p className="font-medium">{mutationDot.mutationLabel}</p>
                  <p className="text-muted-foreground">
                    {mutationDot.mutationType}
                  </p>
                  <p className="font-mono font-medium tabular-nums">
                    {formatCurrency(mutationDot.mutationValue, currency)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatShortDate(new Date(mutationDot.timestamp))}
                  </p>
                </div>
              );
            }

            return (
              <ChartTooltipContent
                payload={payload}
                active={active}
                labelFormatter={() => {
                  const point = chartData[monthIndex];
                  return point ? formatDate(point.date as Date) : "";
                }}
                formatter={(value, name) => {
                  const key = String(name ?? "");
                  const labelText = chartConfig[key]?.label ?? key;
                  const raw = Number(value);
                  const displayValue = liabilitySourceIds.has(key)
                    ? -Math.abs(raw)
                    : raw;
                  return (
                    <span className="text-foreground font-mono font-medium tabular-nums">
                      {labelText}: {formatCurrency(displayValue, currency)}
                    </span>
                  );
                }}
              />
            );
          }}
        />
        <ChartLegend content={<ChartLegendContent />} />

        {sources.map((source) => (
          <Line
            key={source.id}
            xAxisId={axisId}
            yAxisId={axisId}
            type="monotone"
            dataKey={source.id}
            name={source.id}
            stroke={source.color}
            strokeWidth={2}
            dot={createMutationDotRenderer(
              mutationsByLine.get(mutationLineKey(source.id)) ?? [],
            )}
            activeDot={{ r: 4 }}
          />
        ))}

        <Line
          xAxisId={axisId}
          yAxisId={axisId}
          type="monotone"
          dataKey="total"
          name="total"
          stroke="var(--foreground)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={createMutationDotRenderer(
            mutationsByLine.get(mutationLineKey(null)) ?? [],
          )}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
