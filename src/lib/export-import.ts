import type { MutationLinkGroup } from "@/lib/mutation-links";
import { sanitizeLinkGroups } from "@/lib/mutation-links";
import type { AppState } from "@/lib/storage";
import { parseStoredPayload, toStoredPayload } from "@/lib/storage";
import type { Theme } from "@/lib/theme";

export const EXPORT_FORMAT_VERSION = 1;

export interface ExportBundle {
  formatVersion: number;
  exportedAt: string;
  theme: Theme;
  enabledSourceIds: string[];
  enabledMutationIds: string[];
  mutationLinkGroups?: MutationLinkGroup[];
  data: ReturnType<typeof toStoredPayload>;
}

export interface ImportResult {
  currency: AppState["currency"];
  sources: AppState["sources"];
  mutations: AppState["mutations"];
  range: AppState["range"];
  theme: Theme;
  enabledSourceIds: Set<string>;
  enabledMutationIds: Set<string>;
  mutationLinkGroups: MutationLinkGroup[];
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function sanitizeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

export function createExportBundle(input: {
  appState: AppState;
  theme: Theme;
  enabledSourceIds: Set<string>;
  enabledMutationIds: Set<string>;
  mutationLinkGroups: MutationLinkGroup[];
}): ExportBundle {
  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    theme: input.theme,
    enabledSourceIds: [...input.enabledSourceIds],
    enabledMutationIds: [...input.enabledMutationIds],
    mutationLinkGroups: input.mutationLinkGroups,
    data: toStoredPayload(input.appState),
  };
}

export function downloadExportBundle(bundle: ExportBundle): void {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = bundle.exportedAt.slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `wealth-visualizer-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseImportBundle(parsed: unknown): ImportResult | null {
  if (!parsed || typeof parsed !== "object") return null;

  const bundle = parsed as Partial<ExportBundle>;

  if (bundle.formatVersion !== EXPORT_FORMAT_VERSION) return null;
  if (!bundle.data) return null;

  const appState = parseStoredPayload(bundle.data);
  if (!appState) return null;

  const theme = isTheme(bundle.theme) ? bundle.theme : "light";
  const sourceIds = new Set(appState.sources.map((s) => s.id));
  const mutationIds = new Set(appState.mutations.map((m) => m.id));

  const enabledSourceIds = new Set(
    sanitizeIdList(bundle.enabledSourceIds).filter((id) => sourceIds.has(id)),
  );
  const enabledMutationIds = new Set(
    sanitizeIdList(bundle.enabledMutationIds).filter((id) =>
      mutationIds.has(id),
    ),
  );

  for (const id of sourceIds) {
    if (!enabledSourceIds.has(id)) enabledSourceIds.add(id);
  }
  for (const id of mutationIds) {
    if (!enabledMutationIds.has(id)) enabledMutationIds.add(id);
  }

  const mutationLinkGroups = sanitizeLinkGroups(
    bundle.mutationLinkGroups ?? appState.mutationLinkGroups,
    mutationIds,
  );

  return {
    ...appState,
    theme,
    enabledSourceIds,
    enabledMutationIds,
    mutationLinkGroups,
  };
}

export async function readImportFile(file: File): Promise<ImportResult | null> {
  try {
    const text = await file.text();
    return parseImportBundle(JSON.parse(text));
  } catch {
    return null;
  }
}
