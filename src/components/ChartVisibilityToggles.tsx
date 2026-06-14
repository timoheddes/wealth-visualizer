import { formatShortDate } from "@/lib/wealth-calculations";
import { cn } from "@/lib/utils";
import type { Mutation, Source } from "@/types/wealth";

interface ChartVisibilityTogglesProps {
  sources: Source[];
  mutations: Mutation[];
  enabledSourceIds: Set<string>;
  enabledMutationIds: Set<string>;
  onToggleSource: (id: string) => void;
  onToggleMutation: (id: string) => void;
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

function SignIndicator({ sign }: { sign: Sign }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-bold leading-none",
        sign === "positive" &&
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        sign === "negative" && "bg-destructive/15 text-destructive",
        sign === "neutral" && "bg-muted text-muted-foreground",
      )}
      aria-label={
        sign === "positive"
          ? "Positive"
          : sign === "negative"
            ? "Negative"
            : "Neutral"
      }
    >
      {sign === "positive" ? "+" : sign === "negative" ? "−" : "—"}
    </span>
  );
}

function VisibilityToggle({
  enabled,
  onToggle,
  label,
  color,
  sign,
  description,
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  color?: string;
  sign?: Sign;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
        disabled && "opacity-50",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
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
        {sign && <SignIndicator sign={sign} />}
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

export function ChartVisibilityToggles({
  sources,
  mutations,
  enabledSourceIds,
  enabledMutationIds,
  onToggleSource,
  onToggleMutation,
}: ChartVisibilityTogglesProps) {
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

  return (
    <div className="space-y-4 border-t pt-6">
      <div>
        <h3 className="text-sm font-medium">Chart visibility</h3>
        <p className="text-muted-foreground text-xs">
          Toggle sources and mutations on or off without removing them.
        </p>
      </div>

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
                sign={growthSign(source.growth)}
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
                {totalMutations.map((mutation) => (
                  <VisibilityToggle
                    key={mutation.id}
                    enabled={enabledMutationIds.has(mutation.id)}
                    onToggle={() => onToggleMutation(mutation.id)}
                    label={mutation.label}
                    color={undefined}
                    sign={valueSign(mutation.value)}
                    description={mutationDescription(mutation)}
                  />
                ))}
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
                  return (
                    <VisibilityToggle
                      key={mutation.id}
                      enabled={
                        sourceEnabled && enabledMutationIds.has(mutation.id)
                      }
                      disabled={!sourceEnabled}
                      onToggle={() => onToggleMutation(mutation.id)}
                      label={mutation.label}
                      color={undefined}
                      sign={valueSign(mutation.value)}
                      description={mutationDescription(mutation)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
