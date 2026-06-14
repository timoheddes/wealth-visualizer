import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatShortDate } from "@/lib/wealth-calculations";
import {
  getLinkGroupColor,
  getLinkGroupForMutation,
  type MutationLinkGroup,
} from "@/lib/mutation-links";
import { cn } from "@/lib/utils";
import type { Currency, Mutation, Source } from "@/types/wealth";

interface ChartVisibilityTogglesProps {
  sources: Source[];
  mutations: Mutation[];
  currency: Currency;
  enabledSourceIds: Set<string>;
  enabledMutationIds: Set<string>;
  mutationLinkGroups: MutationLinkGroup[];
  onToggleSource: (id: string) => void;
  onToggleMutation: (id: string) => void;
  onCreateMutationLink: (mutationIds: string[]) => void;
  onRemoveMutationLink: (groupId: string) => void;
}

type Sign = "positive" | "negative" | "neutral";

function valueSign(value: number): Sign {
  return value >= 0 ? "positive" : "negative";
}

function growthSign(growth: number): Sign {
  if (growth > 0) return "positive";
  if (growth < 0) return "negative";
  return "neutral";
}

function mutationDescription(mutation: Mutation): string {
  if (mutation.type === "recurring") {
    return `Recurring every ${mutation.frequency} days from ${formatShortDate(mutation.date)}`;
  }
  return `One-off on ${formatShortDate(mutation.date)}`;
}

function GrowthIndicator({ growth }: { growth: number }) {
  const sign = growthSign(growth);

  return (
    <span
      className={cn(
        "flex h-4 min-w-4 shrink-0 cursor-default items-center justify-center rounded px-1 text-[10px] font-bold leading-none tabular-nums",
        sign === "positive" &&
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        sign === "negative" && "bg-destructive/15 text-destructive",
        sign === "neutral" && "bg-muted text-muted-foreground",
      )}
      aria-label={growth === 0 ? "0% growth" : `${growth}% growth`}
    >
      {growth === 0 ? "—" : `${growth}%`}
    </span>
  );
}

function SignIndicator({
  sign,
  value,
  currency,
}: {
  sign: Sign;
  value: number;
  currency: Currency;
}) {
  const formattedValue = `${value >= 0 ? "+" : ""}${formatCurrency(value, currency)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "flex size-4 shrink-0 cursor-help items-center justify-center rounded text-[10px] font-bold leading-none",
            sign === "positive" &&
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            sign === "negative" && "bg-destructive/15 text-destructive",
            sign === "neutral" && "bg-muted text-muted-foreground",
          )}
          aria-label={formattedValue}
        >
          {sign === "positive" ? "+" : sign === "negative" ? "−" : "—"}
        </span>
      </TooltipTrigger>
      <TooltipContent>{formattedValue}</TooltipContent>
    </Tooltip>
  );
}

function LinkGroupIndicator({
  group,
  linkedLabels,
  groupColor,
  onRemoveLink,
}: {
  group: MutationLinkGroup;
  linkedLabels: string[];
  groupColor: string;
  onRemoveLink: (groupId: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 cursor-help items-center justify-center rounded transition-colors"
          aria-label={`Linked with ${linkedLabels.join(", ")}`}
        >
          <Link2 className="size-3.5" style={{ color: groupColor }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Linked mutations</p>
          <p className="text-muted-foreground text-xs">
            Toggling one shows or hides all linked mutations together.
          </p>
        </div>
        <ul className="space-y-1 text-sm">
          {linkedLabels.map((label) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: groupColor }}
                aria-hidden
              />
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onRemoveLink(group.id)}
        >
          Unlink group
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function VisibilityToggle({
  enabled,
  onToggle,
  label,
  color,
  growth,
  sign,
  mutationValue,
  currency,
  description,
  disabled = false,
  linkMode = false,
  selected = false,
  onSelectChange,
  linkGroup,
  linkedLabels = [],
  groupColor,
  onRemoveLink,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  color?: string;
  growth?: number;
  sign?: Sign;
  mutationValue?: number;
  currency: Currency;
  description?: string;
  disabled?: boolean;
  linkMode?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  linkGroup?: MutationLinkGroup | null;
  linkedLabels?: string[];
  groupColor?: string;
  onRemoveLink?: (groupId: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
        disabled && "opacity-50",
        linkGroup && "border-l-2",
      )}
      style={
        linkGroup && groupColor
          ? { borderLeftColor: groupColor }
          : undefined
      }
    >
      <div className="flex min-w-0 items-center gap-2">
        {linkMode && onSelectChange && (
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            onChange={(e) => onSelectChange(e.target.checked)}
            className="size-4 shrink-0 rounded border"
            aria-label={`Select ${label} for linking`}
          />
        )}
        {linkGroup && groupColor && onRemoveLink && (
          <LinkGroupIndicator
            group={linkGroup}
            linkedLabels={linkedLabels}
            groupColor={groupColor}
            onRemoveLink={onRemoveLink}
          />
        )}
        {color && (
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-full transition-opacity",
              !enabled && "opacity-40",
            )}
            style={{ backgroundColor: color }}
            aria-hidden
          />
        )}
        {growth != null && <GrowthIndicator growth={growth} />}
        {sign && mutationValue != null && (
          <SignIndicator
            sign={sign}
            value={mutationValue}
            currency={currency}
          />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-medium",
              !enabled && "text-muted-foreground",
            )}
          >
            {label}
          </p>
          {description && (
            <p className="text-muted-foreground truncate text-xs">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Hide" : "Show"} ${label}`}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform",
            enabled && "translate-x-4",
          )}
        />
      </button>
    </div>
  );
}

function MutationVisibilityToggle({
  mutation,
  mutations,
  currency,
  enabled,
  disabled,
  linkMode,
  selected,
  onSelectChange,
  mutationLinkGroups,
  onToggle,
  onRemoveMutationLink,
}: {
  mutation: Mutation;
  mutations: Mutation[];
  currency: Currency;
  enabled: boolean;
  disabled?: boolean;
  linkMode: boolean;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
  mutationLinkGroups: MutationLinkGroup[];
  onToggle: () => void;
  onRemoveMutationLink: (groupId: string) => void;
}) {
  const linkGroup = getLinkGroupForMutation(mutationLinkGroups, mutation.id);
  const linkedLabels = useMemo(() => {
    if (!linkGroup) return [];
    return linkGroup.mutationIds
      .map((id) => mutations.find((m) => m.id === id)?.label)
      .filter((label): label is string => Boolean(label));
  }, [linkGroup, mutations]);

  const groupColor = linkGroup
    ? getLinkGroupColor(linkGroup.id, mutationLinkGroups)
    : undefined;

  return (
    <VisibilityToggle
      enabled={enabled}
      onToggle={onToggle}
      label={mutation.label}
      sign={valueSign(mutation.value)}
      mutationValue={mutation.value}
      currency={currency}
      description={mutationDescription(mutation)}
      disabled={disabled}
      linkMode={linkMode}
      selected={selected}
      onSelectChange={onSelectChange}
      linkGroup={linkGroup}
      linkedLabels={linkedLabels}
      groupColor={groupColor}
      onRemoveLink={onRemoveMutationLink}
    />
  );
}

export function ChartVisibilityToggles({
  sources,
  mutations,
  currency,
  enabledSourceIds,
  enabledMutationIds,
  mutationLinkGroups,
  onToggleSource,
  onToggleMutation,
  onCreateMutationLink,
  onRemoveMutationLink,
}: ChartVisibilityTogglesProps) {
  const [linkMode, setLinkMode] = useState(false);
  const [selectedMutationIds, setSelectedMutationIds] = useState<Set<string>>(
    () => new Set(),
  );

  if (sources.length === 0 && mutations.length === 0) return null;

  const totalMutations = mutations.filter((m) => m.target === "total");
  const mutationsBySource = sources
    .map((source) => ({
      source,
      mutations: mutations.filter(
        (m) => m.target === "source" && m.sourceId === source.id,
      ),
    }))
    .filter((group) => group.mutations.length > 0);

  function exitLinkMode() {
    setLinkMode(false);
    setSelectedMutationIds(new Set());
  }

  function toggleMutationSelection(id: string, selected: boolean) {
    setSelectedMutationIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleCreateLink() {
    if (selectedMutationIds.size < 2) return;
    onCreateMutationLink([...selectedMutationIds]);
    exitLinkMode();
  }

  function renderMutationToggle(
    mutation: Mutation,
    options?: { disabled?: boolean },
  ) {
    const sourceDisabled =
      mutation.target === "source" &&
      mutation.sourceId != null &&
      !enabledSourceIds.has(mutation.sourceId);

    return (
      <MutationVisibilityToggle
        key={mutation.id}
        mutation={mutation}
        mutations={mutations}
        currency={currency}
        enabled={
          !sourceDisabled && enabledMutationIds.has(mutation.id)
        }
        disabled={options?.disabled ?? sourceDisabled}
        linkMode={linkMode}
        selected={selectedMutationIds.has(mutation.id)}
        onSelectChange={(selected) =>
          toggleMutationSelection(mutation.id, selected)
        }
        mutationLinkGroups={mutationLinkGroups}
        onToggle={() => onToggleMutation(mutation.id)}
        onRemoveMutationLink={onRemoveMutationLink}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 border-t pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Chart visibility</h3>
            <p className="text-muted-foreground text-xs">
              Toggle sources and mutations on or off without removing them.
            </p>
          </div>
          {mutations.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2">
              {linkMode ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={selectedMutationIds.size < 2}
                    onClick={handleCreateLink}
                  >
                    Link selected ({selectedMutationIds.size})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={exitLinkMode}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkMode(true)}
                >
                  <Link2 className="size-4" />
                  Link mutations
                </Button>
              )}
            </div>
          )}
        </div>

        {linkMode && (
          <p className="text-muted-foreground text-xs">
            Select two or more mutations to link. Linked mutations toggle
            together — useful for one-off events and recurring transfer pairs.
          </p>
        )}

        {sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Sources
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <VisibilityToggle
                  key={source.id}
                  enabled={enabledSourceIds.has(source.id)}
                  onToggle={() => onToggleSource(source.id)}
                  label={source.label}
                  color={source.color}
                  growth={source.growth}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        )}

        {mutations.length > 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Mutations
            </p>

            {totalMutations.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span
                    className="size-2 shrink-0 rounded-full bg-foreground"
                    aria-hidden
                  />
                  Total
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {totalMutations.map((mutation) => renderMutationToggle(mutation))}
                </div>
              </div>
            )}

            {mutationsBySource.map(({ source, mutations: groupMutations }) => (
              <div key={source.id} className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: source.color }}
                    aria-hidden
                  />
                  {source.label}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {groupMutations.map((mutation) => {
                    const sourceEnabled = enabledSourceIds.has(source.id);
                    return renderMutationToggle(mutation, {
                      disabled: !sourceEnabled,
                    });
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
