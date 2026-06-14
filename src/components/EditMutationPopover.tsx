import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/LoadingButton";
import { useDeferredAction } from "@/lib/use-deferred-action";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formValuesToMutation,
  mutationToFormValues,
  MutationFormFields,
  type MutationFormValues,
} from "@/components/MutationFormFields";
import type { Mutation, Source } from "@/types/wealth";
import { TOTAL_MUTATION_APPLIES_TO } from "@/types/wealth";

interface EditMutationPopoverProps {
  mutation: Mutation;
  sources: Source[];
  onSave: (mutation: Mutation) => void;
}

export function EditMutationPopover({
  mutation,
  sources,
  onSave,
}: EditMutationPopoverProps) {
  const { isPending, run } = useDeferredAction();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<MutationFormValues>(() =>
    mutationToFormValues(mutation),
  );

  useEffect(() => {
    if (open) {
      setValues(mutationToFormValues(mutation));
    }
  }, [open, mutation]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.label.trim() || isPending) return;
    if (
      values.appliesTo !== TOTAL_MUTATION_APPLIES_TO &&
      !values.appliesTo
    ) {
      return;
    }
    if (values.type === "recurring" && Number(values.frequency) <= 0) return;

    run(() => {
      onSave({ ...formValuesToMutation(values), id: mutation.id });
      setOpen(false);
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground shrink-0"
          aria-label={`Edit ${mutation.label}`}
        >
          <Pencil className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <h4 className="leading-none font-medium">Edit mutation</h4>
            <p className="text-muted-foreground mt-1 text-sm">{mutation.label}</p>
          </div>

          <MutationFormFields
            values={values}
            onChange={setValues}
            sources={sources}
            idPrefix={`edit-mutation-${mutation.id}`}
          />

          <LoadingButton
            type="submit"
            className="w-full"
            isLoading={isPending}
            loadingLabel="Saving changes..."
          >
            Save changes
          </LoadingButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
