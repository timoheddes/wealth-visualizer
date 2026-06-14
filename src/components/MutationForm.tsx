import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createDefaultMutationValues,
  formValuesToMutation,
  MutationFormFields,
} from "@/components/MutationFormFields";
import type { Mutation, Source } from "@/types/wealth";

interface MutationFormProps {
  sources: Source[];
  onAdd: (mutation: Omit<Mutation, "id">) => void;
}

export function MutationForm({ sources, onAdd }: MutationFormProps) {
  const [values, setValues] = useState(() =>
    createDefaultMutationValues(sources),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.label.trim() || !values.sourceId) return;
    if (values.type === "recurring" && Number(values.frequency) <= 0) return;

    onAdd(formValuesToMutation(values));
    setValues(createDefaultMutationValues(sources));
  }

  if (sources.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Add a wealth source before recording mutations.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <MutationFormFields
        values={values}
        onChange={setValues}
        sources={sources}
        idPrefix="mutation"
      />
      <Button type="submit" className="w-full">
        Add mutation
      </Button>
    </form>
  );
}
