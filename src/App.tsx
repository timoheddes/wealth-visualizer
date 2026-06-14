import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencySelect } from "@/components/CurrencySelect";
import { EditMutationPopover } from "@/components/EditMutationPopover";
import { EditSourcePopover } from "@/components/EditSourcePopover";
import { MutationForm } from "@/components/MutationForm";
import { SourceForm } from "@/components/SourceForm";
import { TimeRangeSlider } from "@/components/TimeRangeSlider";
import { WealthChart } from "@/components/WealthChart";
import {
  formatCurrency,
  formatShortDate,
  getDataBounds,
} from "@/lib/wealth-calculations";
import type { Currency, Mutation, Source, TimeRange } from "@/types/wealth";
import { MUTATION_TYPE_LABELS, WEALTH_TYPE_LABELS } from "@/types/wealth";
import { loadAppState, saveAppState } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";

function createId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [initialState] = useState(() => loadAppState());
  const [currency, setCurrency] = useState<Currency>(initialState.currency);
  const [sources, setSources] = useState<Source[]>(initialState.sources);
  const [mutations, setMutations] = useState<Mutation[]>(initialState.mutations);
  const [range, setRange] = useState<TimeRange | null>(initialState.range);

  useEffect(() => {
    saveAppState({ currency, sources, mutations, range });
  }, [currency, sources, mutations, range]);

  const bounds = useMemo(() => getDataBounds(sources), [sources]);

  const activeRange = useMemo(() => {
    if (!bounds) return null;
    return range ?? bounds;
  }, [bounds, range]);

  const mutationsBySource = useMemo((): Array<{
    source: Source | null;
    mutations: Mutation[];
  }> => {
    const bySourceId = new Map<string, Mutation[]>();
    for (const mutation of mutations) {
      const group = bySourceId.get(mutation.sourceId) ?? [];
      group.push(mutation);
      bySourceId.set(mutation.sourceId, group);
    }

    const grouped: Array<{ source: Source | null; mutations: Mutation[] }> =
      sources
        .filter((source) => bySourceId.has(source.id))
        .map((source) => ({
          source,
          mutations: bySourceId.get(source.id)!,
        }));

    for (const [sourceId, sourceMutations] of bySourceId) {
      if (!sources.some((s) => s.id === sourceId)) {
        grouped.push({
          source: null,
          mutations: sourceMutations,
        });
      }
    }

    return grouped;
  }, [mutations, sources]);

  function handleAddSource(source: Omit<Source, "id">) {
    setSources((prev) => [...prev, { ...source, id: createId() }]);
  }

  function handleAddMutation(mutation: Omit<Mutation, "id">) {
    setMutations((prev) => [...prev, { ...mutation, id: createId() }]);
  }

  function handleUpdateSource(updated: Source) {
    setSources((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
  }

  function handleUpdateMutation(updated: Mutation) {
    setMutations((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }

  function handleRemoveSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
    setMutations((prev) => prev.filter((m) => m.sourceId !== id));
  }

  function handleRemoveMutation(id: string) {
    setMutations((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Wealth Visualizer
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Project and track wealth across sources, growth, and one-off
              mutations.
            </p>
          </div>
          <CurrencySelect value={currency} onChange={setCurrency} />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add source</CardTitle>
              <CardDescription>
                A fund or asset with initial value and projected growth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SourceForm onAdd={handleAddSource} sourcesCount={sources.length} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add mutation</CardTitle>
              <CardDescription>
                One-off contribution or expense applied on a specific date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MutationForm sources={sources} onAdd={handleAddMutation} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
              <CardDescription>{sources.length} active</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sources yet.</p>
              ) : (
                sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-start justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: source.color }}
                          aria-hidden
                        />
                        <span className="truncate font-medium">
                          {source.label}
                        </span>
                        <Badge variant="secondary">
                          {WEALTH_TYPE_LABELS[source.type]}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatCurrency(source.initialValue, currency)} · {source.growth}%
                        /yr
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatShortDate(source.initialDate)} →{" "}
                        {formatShortDate(source.endDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <EditSourcePopover
                        source={source}
                        onSave={handleUpdateSource}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSource(source.id)}
                        aria-label={`Remove ${source.label}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {mutations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mutations</CardTitle>
                <CardDescription>{mutations.length} recorded</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mutationsBySource.map(({ source, mutations: groupMutations }) => (
                  <div
                    key={source?.id ?? "unknown"}
                    className="overflow-hidden rounded-lg border"
                  >
                    <div className="bg-muted/50 flex items-center gap-2 border-b px-3 py-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: source?.color ?? "var(--muted-foreground)",
                        }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">
                        {source?.label ?? "Unknown source"}
                      </span>
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        {groupMutations.length}{" "}
                        {groupMutations.length === 1 ? "mutation" : "mutations"}
                      </span>
                    </div>
                    <div className="divide-y">
                      {groupMutations.map((mutation) => (
                        <div
                          key={mutation.id}
                          className="flex items-start justify-between gap-2 p-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: mutation.color }}
                                aria-hidden
                              />
                              <span className="truncate font-medium">
                                {mutation.label}
                              </span>
                              <Badge variant="secondary">
                                {MUTATION_TYPE_LABELS[mutation.type]}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {mutation.type === "recurring"
                                ? `Every ${mutation.frequency}d from ${formatShortDate(mutation.date)}`
                                : formatShortDate(mutation.date)}
                              {mutation.type === "recurring" && mutation.endDate
                                ? ` → ${formatShortDate(mutation.endDate)}`
                                : ""}
                            </p>
                            <p
                              className={`text-sm font-medium tabular-nums ${
                                mutation.value >= 0
                                  ? "text-emerald-600"
                                  : "text-destructive"
                              }`}
                            >
                              {mutation.value >= 0 ? "+" : ""}
                              {formatCurrency(mutation.value, currency)}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <EditMutationPopover
                              mutation={mutation}
                              sources={sources}
                              onSave={handleUpdateMutation}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveMutation(mutation.id)}
                              aria-label={`Remove ${mutation.label}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>

        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projection</CardTitle>
              <CardDescription>
                Each source is a line; dashed line is total. Dots mark mutations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeRange && bounds && (
                <TimeRangeSlider
                  bounds={bounds}
                  range={activeRange}
                  onChange={setRange}
                />
              )}
              {activeRange && (
                <WealthChart
                  sources={sources}
                  mutations={mutations}
                  range={activeRange}
                  currency={currency}
                />
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
