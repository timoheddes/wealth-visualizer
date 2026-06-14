import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDateInput, toDateInputValue } from "@/lib/wealth-calculations";
import type { Mutation, MutationType, Source } from "@/types/wealth";
import {
  MUTATION_TYPE_LABELS,
  TOTAL_MUTATION_APPLIES_TO,
} from "@/types/wealth";

export interface MutationFormValues {
  appliesTo: string;
  label: string;
  value: string;
  date: string;
  type: MutationType;
  frequency: string;
  endDate: string;
  color: string;
}

export function createDefaultMutationValues(
  sources: Source[],
): MutationFormValues {
  const source = sources[0];
  return {
    appliesTo: source?.id ?? TOTAL_MUTATION_APPLIES_TO,
    label: "",
    value: "1000",
    date: toDateInputValue(new Date()),
    type: "once",
    frequency: "30",
    endDate: "",
    color: source?.color ?? "#4c6ef5",
  };
}

export function mutationToFormValues(mutation: Mutation): MutationFormValues {
  return {
    appliesTo:
      mutation.target === "total"
        ? TOTAL_MUTATION_APPLIES_TO
        : (mutation.sourceId ?? TOTAL_MUTATION_APPLIES_TO),
    label: mutation.label,
    value: String(mutation.value),
    date: toDateInputValue(mutation.date),
    type: mutation.type,
    frequency: String(mutation.frequency),
    endDate: mutation.endDate ? toDateInputValue(mutation.endDate) : "",
    color: mutation.color,
  };
}

export function formValuesToMutation(
  values: MutationFormValues,
): Omit<Mutation, "id"> {
  const isTotal = values.appliesTo === TOTAL_MUTATION_APPLIES_TO;

  return {
    target: isTotal ? "total" : "source",
    sourceId: isTotal ? null : values.appliesTo,
    label: values.label.trim(),
    value: Number(values.value),
    date: parseDateInput(values.date),
    type: values.type,
    frequency: values.type === "recurring" ? Number(values.frequency) : 0,
    endDate:
      values.type === "recurring" && values.endDate
        ? parseDateInput(values.endDate)
        : null,
    color: values.color,
  };
}

interface MutationFormFieldsProps {
  values: MutationFormValues;
  onChange: (values: MutationFormValues) => void;
  sources: Source[];
  idPrefix: string;
}

export function MutationFormFields({
  values,
  onChange,
  sources,
  idPrefix,
}: MutationFormFieldsProps) {
  const fieldId = (field: string) => `${idPrefix}-${field}`;

  function update(patch: Partial<MutationFormValues>) {
    onChange({ ...values, ...patch });
  }

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={fieldId("appliesTo")}>Applies to</Label>
        <Select
          value={values.appliesTo}
          onValueChange={(appliesTo) => {
            if (appliesTo === TOTAL_MUTATION_APPLIES_TO) {
              update({ appliesTo });
              return;
            }
            const source = sources.find((s) => s.id === appliesTo);
            update({
              appliesTo,
              color: source?.color ?? values.color,
            });
          }}
        >
          <SelectTrigger id={fieldId("appliesTo")}>
            <SelectValue placeholder="Select target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOTAL_MUTATION_APPLIES_TO}>Total</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("label")}>Label</Label>
        <Input
          id={fieldId("label")}
          placeholder="e.g. Monthly contribution"
          value={values.label}
          onChange={(e) => update({ label: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("type")}>Type</Label>
        <Select
          value={values.type}
          onValueChange={(type: MutationType) => update({ type })}
        >
          <SelectTrigger id={fieldId("type")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MUTATION_TYPE_LABELS) as MutationType[]).map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {MUTATION_TYPE_LABELS[type]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("color")}>Chart color</Label>
        <div className="flex items-center gap-3">
          <Input
            id={fieldId("color")}
            type="color"
            value={values.color}
            onChange={(e) => update({ color: e.target.value })}
            className="h-9 w-14 cursor-pointer p-1"
          />
          <span className="text-muted-foreground font-mono text-sm">
            {values.color}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={fieldId("value")}>Value</Label>
          <Input
            id={fieldId("value")}
            type="number"
            step="any"
            value={values.value}
            onChange={(e) => update({ value: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("date")}>
            {values.type === "recurring" ? "Start date" : "Date"}
          </Label>
          <Input
            id={fieldId("date")}
            type="date"
            style={{ fontSize: "0.7em" }}
            value={values.date}
            onChange={(e) => update({ date: e.target.value })}
            required
          />
        </div>
      </div>

      {values.type === "recurring" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor={fieldId("frequency")}>Frequency (days)</Label>
            <Input
              id={fieldId("frequency")}
              type="number"
              min="1"
              step="1"
              value={values.frequency}
              onChange={(e) => update({ frequency: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={fieldId("endDate")}>End date (optional)</Label>
            <Input
              id={fieldId("endDate")}
              type="date"
              style={{ fontSize: "0.7em" }}
              value={values.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </>
  );
}
