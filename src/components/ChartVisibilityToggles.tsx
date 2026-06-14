import { cn } from "@/lib/utils";
import type { Mutation, Source } from "@/types/wealth";
import { MUTATION_TYPE_LABELS } from "@/types/wealth";

interface ChartVisibilityTogglesProps {
  sources: Source[];
  mutations: Mutation[];
  enabledSourceIds: Set<string>;
  enabledMutationIds: Set<string>;
  onToggleSource: (id: string) => void;
  onToggleMutation: (id: string) => void;
}

function VisibilityToggle({
  enabled,
  onToggle,
  label,
  color,
  description,
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  color?: string;
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
                    color={mutation.color}
                    description={MUTATION_TYPE_LABELS[mutation.type]}
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
                      color={mutation.color}
                      description={MUTATION_TYPE_LABELS[mutation.type]}
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
