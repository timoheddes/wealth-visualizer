import {
  CartesianGrid,
  Line,
  LineChart,
  Scatter,
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
import type { Currency, Mutation, Source, TimeRange } from "@/types/wealth";
import { MUTATION_TYPE_LABELS } from "@/types/wealth";

interface WealthChartProps {
  sources: Source[];
  mutations: Mutation[];
  range: TimeRange;
  currency: Currency;
}

interface MutationScatterPoint {
  timestamp: number;
  y: number;
  mutationLabel: string;
  mutationValue: number;
  mutationType: string;
  color: string;
}

export function WealthChart({
  sources,
  mutations,
  range,
  currency,
}: WealthChartProps) {
  const data = buildChartData(sources, mutations, range);
  const markers = getMutationMarkers(sources, mutations, range);

  const scatterData: MutationScatterPoint[] = markers.map((marker) => ({
    timestamp: marker.timestamp,
    y: marker.y,
    mutationLabel: marker.mutation.label,
    mutationValue: marker.mutation.value,
    mutationType: MUTATION_TYPE_LABELS[marker.mutation.type],
    color: marker.mutation.color,
  }));

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

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(ts) => formatDate(new Date(ts))}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => formatCurrency(v, currency)}
          width={80}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;

            const mutationPoint = payload.find(
              (item) =>
                item.payload &&
                "mutationLabel" in item.payload &&
                item.payload.mutationLabel,
            );

            if (mutationPoint?.payload) {
              const point = mutationPoint.payload as MutationScatterPoint;
              return (
                <div className="border-border/50 bg-background grid min-w-[8rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                  <p className="font-medium">{point.mutationLabel}</p>
                  <p className="text-muted-foreground">{point.mutationType}</p>
                  <p className="font-mono font-medium tabular-nums">
                    {formatCurrency(point.mutationValue, currency)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatShortDate(new Date(point.timestamp))}
                  </p>
                </div>
              );
            }

            return (
              <ChartTooltipContent
                payload={payload.filter(
                  (item) =>
                    !item.payload ||
                    !("mutationLabel" in item.payload) ||
                    !item.payload.mutationLabel,
                )}
                active={active}
                labelFormatter={(_, items) => {
                  const point = items?.[0]?.payload;
                  if (!point?.date) return "";
                  return formatDate(point.date as Date);
                }}
                formatter={(value, name) => {
                  const key = String(name ?? "");
                  const label = chartConfig[key]?.label ?? key;
                  return (
                    <span className="text-foreground font-mono font-medium tabular-nums">
                      {label}: {formatCurrency(Number(value), currency)}
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
            type="monotone"
            dataKey={source.id}
            name={source.id}
            stroke={source.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}

        <Line
          type="monotone"
          dataKey="total"
          name="total"
          stroke="var(--foreground)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{ r: 4 }}
        />

        {scatterData.length > 0 && (
          <Scatter
            data={scatterData}
            dataKey="y"
            name="Mutations"
            isAnimationActive={false}
            legendType="none"
            shape={(props: {
              cx?: number;
              cy?: number;
              payload?: MutationScatterPoint;
            }) => {
              const { cx, cy, payload } = props;
              const color = payload?.color ?? "var(--chart-1)";
              if (cx == null || cy == null) return <g />;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              );
            }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
