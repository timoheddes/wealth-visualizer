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
import { HowItWorksSheet } from "@/components/HowItWorksSheet";
import { ChartVisibilityToggles } from "@/components/ChartVisibilityToggles";
import { CurrencySelect } from "@/components/CurrencySelect";
import { DataTransferControls } from "@/components/DataTransferControls";
import { EditMutationPopover } from "@/components/EditMutationPopover";
import { EditSourcePopover } from "@/components/EditSourcePopover";
import { MutationForm } from "@/components/MutationForm";
import { SourceForm } from "@/components/SourceForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimeRangeSlider } from "@/components/TimeRangeSlider";
import { WealthChart } from "@/components/WealthChart";
import {
  clampRange,
  formatCurrency,
  formatShortDate,
  getDataBounds,
} from "@/lib/wealth-calculations";
import type { Currency, Mutation, Source, TimeRange } from "@/types/wealth";
import { MUTATION_TYPE_LABELS, WEALTH_TYPE_LABELS } from "@/types/wealth";
import { loadAppState, saveAppState } from "@/lib/storage";
import type { ImportResult } from "@/lib/export-import";
import {
  createLinkGroup,
  getLinkedMutationIds,
  removeLinkGroup,
  removeMutationFromLinkGroups,
  type MutationLinkGroup,
} from "@/lib/mutation-links";
import { applyTheme, getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme";
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
  const [enabledSourceIds, setEnabledSourceIds] = useState<Set<string>>(
    () => new Set(initialState.sources.map((s) => s.id)),
  );
  const [enabledMutationIds, setEnabledMutationIds] = useState<Set<string>>(
    () => new Set(initialState.mutations.map((m) => m.id)),
  );
  const [mutationLinkGroups, setMutationLinkGroups] = useState<
    MutationLinkGroup[]
  >(() => initialState.mutationLinkGroups);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveAppState({ currency, sources, mutations, range, mutationLinkGroups });
  }, [currency, sources, mutations, range, mutationLinkGroups]);

  const mutationGroups = useMemo((): Array<{
    key: string;
    label: string;
    color?: string;
    mutations: Mutation[];
  }> => {
    const groups: Array<{
      key: string;
      label: string;
      color?: string;
      mutations: Mutation[];
    }> = [];

    const totalMutations = mutations.filter((m) => m.target === "total");
    if (totalMutations.length > 0) {
      groups.push({
        key: "total",
        label: "Total",
        mutations: totalMutations,
      });
    }

    for (const source of sources) {
      const sourceMutations = mutations.filter(
        (m) => m.target === "source" && m.sourceId === source.id,
      );
      if (sourceMutations.length > 0) {
        groups.push({
          key: source.id,
          label: source.label,
          color: source.color,
          mutations: sourceMutations,
        });
      }
    }

    const orphaned = mutations.filter(
      (m) =>
        m.target === "source" &&
        m.sourceId != null &&
        !sources.some((s) => s.id === m.sourceId),
    );
    if (orphaned.length > 0) {
      groups.push({
        key: "unknown",
        label: "Unknown source",
        mutations: orphaned,
      });
    }

    return groups;
  }, [mutations, sources]);

  const visibleSources = useMemo(
    () => sources.filter((s) => enabledSourceIds.has(s.id)),
    [sources, enabledSourceIds],
  );

  const visibleMutations = useMemo(
    () =>
      mutations.filter((m) => {
        if (!enabledMutationIds.has(m.id)) return false;
        if (m.target === "total") return true;
        return m.sourceId != null && enabledSourceIds.has(m.sourceId);
      }),
    [mutations, enabledMutationIds, enabledSourceIds],
  );

  const chartBounds = useMemo(
    () => getDataBounds(sources, mutations),
    [sources, mutations],
  );

  useEffect(() => {
    if (!chartBounds) return;
    setRange((current) =>
      current ? clampRange(current, chartBounds) : null,
    );
  }, [chartBounds]);

  const chartRange = useMemo(() => {
    if (!chartBounds) return null;
    return range ?? chartBounds;
  }, [chartBounds, range]);

  function handleAddSource(source: Omit<Source, "id">) {
    const id = createId();
    setSources((prev) => [...prev, { ...source, id }]);
    setEnabledSourceIds((prev) => new Set([...prev, id]));
  }

  function handleAddMutation(mutation: Omit<Mutation, "id">) {
    const id = createId();
    setMutations((prev) => [...prev, { ...mutation, id }]);
    setEnabledMutationIds((prev) => new Set([...prev, id]));
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
    const removedMutationIds = mutations
      .filter((m) => m.target === "source" && m.sourceId === id)
      .map((m) => m.id);

    setSources((prev) => prev.filter((s) => s.id !== id));
    setMutations((prev) =>
      prev.filter((m) => m.target !== "source" || m.sourceId !== id),
    );
    setEnabledSourceIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEnabledMutationIds((prev) => {
      const next = new Set(prev);
      for (const mutationId of next) {
        const mutation = mutations.find((m) => m.id === mutationId);
        if (mutation?.target === "source" && mutation.sourceId === id) {
          next.delete(mutationId);
        }
      }
      return next;
    });
    setMutationLinkGroups((prev) =>
      removedMutationIds.reduce(
        (groups, mutationId) =>
          removeMutationFromLinkGroups(groups, mutationId),
        prev,
      ),
    );
  }

  function handleRemoveMutation(id: string) {
    setMutations((prev) => prev.filter((m) => m.id !== id));
    setEnabledMutationIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMutationLinkGroups((prev) => removeMutationFromLinkGroups(prev, id));
  }

  function toggleSourceVisibility(id: string) {
    setEnabledSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMutationVisibility(id: string) {
    const linkedIds = getLinkedMutationIds(mutationLinkGroups, id);
    setEnabledMutationIds((prev) => {
      const next = new Set(prev);
      const willEnable = !prev.has(id);
      for (const mutationId of linkedIds) {
        if (willEnable) next.add(mutationId);
        else next.delete(mutationId);
      }
      return next;
    });
  }

  function handleCreateMutationLink(mutationIds: string[]) {
    setMutationLinkGroups((prev) => createLinkGroup(prev, mutationIds));
  }

  function handleRemoveMutationLink(groupId: string) {
    setMutationLinkGroups((prev) => removeLinkGroup(prev, groupId));
  }

  function handleImport(data: ImportResult) {
    setCurrency(data.currency);
    setSources(data.sources);
    setMutations(data.mutations);
    setRange(data.range);
    setTheme(data.theme);
    setEnabledSourceIds(data.enabledSourceIds);
    setEnabledMutationIds(data.enabledMutationIds);
    setMutationLinkGroups(data.mutationLinkGroups);
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
            <HowItWorksSheet />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4">
            <DataTransferControls
              appState={{
                currency,
                sources,
                mutations,
                range,
                mutationLinkGroups,
              }}
              theme={theme}
              enabledSourceIds={enabledSourceIds}
              enabledMutationIds={enabledMutationIds}
              mutationLinkGroups={mutationLinkGroups}
              onImport={handleImport}
            />
            <ThemeToggle theme={theme} onChange={setTheme} />
            <CurrencySelect value={currency} onChange={setCurrency} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add source</CardTitle>
              <CardDescription>
                Assets and liabilities with initial balance, growth, and an end date.
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
                Applied to a source or the chart total.
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
                {mutationGroups.map(({ key, label, color, mutations: groupMutations }) => (
                  <div
                    key={key}
                    className="overflow-hidden rounded-lg border"
                  >
                    <div className="bg-muted/50 flex items-center gap-2 border-b px-3 py-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            color ?? "var(--foreground)",
                        }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">
                        {label}
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
              {chartRange && chartBounds && visibleSources.length > 0 && (
                <TimeRangeSlider
                  bounds={chartBounds}
                  range={chartRange}
                  onChange={setRange}
                />
              )}
              {chartRange && visibleSources.length > 0 ? (
                <WealthChart
                  sources={visibleSources}
                  mutations={visibleMutations}
                  range={chartRange}
                  currency={currency}
                />
              ) : (
                <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed text-sm">
                  {sources.length === 0
                    ? "Add wealth sources to see the projection chart."
                    : "Enable at least one source to see the projection chart."}
                </div>
              )}
              <ChartVisibilityToggles
                sources={sources}
                mutations={mutations}
                currency={currency}
                enabledSourceIds={enabledSourceIds}
                enabledMutationIds={enabledMutationIds}
                mutationLinkGroups={mutationLinkGroups}
                onToggleSource={toggleSourceVisibility}
                onToggleMutation={toggleMutationVisibility}
                onCreateMutationLink={handleCreateMutationLink}
                onRemoveMutationLink={handleRemoveMutationLink}
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
