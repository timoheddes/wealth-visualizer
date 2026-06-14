import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/LoadingButton";
import { useDeferredAction } from "@/lib/use-deferred-action";
import type { AppState } from "@/lib/storage";
import {
  createExportBundle,
  downloadExportBundle,
  readImportFile,
  type ImportResult,
} from "@/lib/export-import";
import type { Theme } from "@/lib/theme";
import type { MutationLinkGroup } from "@/lib/mutation-links";

interface DataTransferControlsProps {
  appState: AppState;
  theme: Theme;
  enabledSourceIds: Set<string>;
  enabledMutationIds: Set<string>;
  mutationLinkGroups: MutationLinkGroup[];
  onImport: (data: ImportResult) => void;
}

export function DataTransferControls({
  appState,
  theme,
  enabledSourceIds,
  enabledMutationIds,
  mutationLinkGroups,
  onImport,
}: DataTransferControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const { isPending: isImporting, run: runImport } = useDeferredAction();

  function handleExport() {
    const bundle = createExportBundle({
      appState,
      theme,
      enabledSourceIds,
      enabledMutationIds,
      mutationLinkGroups,
    });
    downloadExportBundle(bundle);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImportError(null);
    const result = await readImportFile(file);
    if (!result) {
      setImportError("Invalid export file.");
      return;
    }

    const confirmed = window.confirm(
      "Import this file? Your current sources, mutations, and settings will be replaced.",
    );
    if (!confirmed) return;

    runImport(() => onImport(result));
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleExport}>
        <Download className="size-4" />
        Export
      </Button>
      <LoadingButton
        type="button"
        variant="outline"
        size="sm"
        isLoading={isImporting}
        loadingLabel="Importing..."
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-4" />
        Import
      </LoadingButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      {importError && (
        <span className="text-destructive text-xs">{importError}</span>
      )}
    </div>
  );
}
