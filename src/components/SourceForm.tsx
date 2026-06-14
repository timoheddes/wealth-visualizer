import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { Source, WealthType } from "@/types/wealth";
import {
  DEFAULT_GROWTH_BY_TYPE,
  getDefaultSourceColor,
  WEALTH_TYPE_LABELS,
} from "@/types/wealth";

export interface SourceFormValues {
  type: WealthType;
  label: string;
  color: string;
  initialValue: string;
  initialDate: string;
  endDate: string;
  growth: string;
}

const defaultValues = (color: string): SourceFormValues => ({
  type: "investment",
  label: "",
  color,
  initialValue: "10000",
  initialDate: toDateInputValue(new Date()),
  endDate: toDateInputValue(
    new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
  ),
  growth: String(DEFAULT_GROWTH_BY_TYPE.investment),
});

interface SourceFormProps {
  onAdd: (source: Omit<Source, "id">) => void;
  sourcesCount: number;
}

export function SourceForm({ onAdd, sourcesCount }: SourceFormProps) {
  const [values, setValues] = useState<SourceFormValues>(() =>
    defaultValues(getDefaultSourceColor(sourcesCount)),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.label.trim()) return;

    onAdd({
      type: values.type,
      label: values.label.trim(),
      color: values.color,
      initialValue: Number(values.initialValue),
      initialDate: parseDateInput(values.initialDate),
      endDate: parseDateInput(values.endDate),
      growth: Number(values.growth),
    });
    setValues(defaultValues(getDefaultSourceColor(sourcesCount + 1)));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="source-label">Label</Label>
        <Input
          id="source-label"
          placeholder="e.g. Index fund"
          value={values.label}
          onChange={(e) => setValues((v) => ({ ...v, label: e.target.value }))}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="source-type">Type</Label>
        <Select
          value={values.type}
          onValueChange={(type: WealthType) =>
            setValues((v) => ({
              ...v,
              type,
              growth: String(DEFAULT_GROWTH_BY_TYPE[type]),
            }))
          }
        >
          <SelectTrigger id="source-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(WEALTH_TYPE_LABELS) as WealthType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {WEALTH_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="source-color">Chart color</Label>
        <div className="flex items-center gap-3">
          <Input
            id="source-color"
            type="color"
            value={values.color}
            onChange={(e) =>
              setValues((v) => ({ ...v, color: e.target.value }))
            }
            className="h-9 w-14 cursor-pointer p-1"
          />
          <span className="text-muted-foreground font-mono text-sm">
            {values.color}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="source-initial">Initial value</Label>
          <Input
            id="source-initial"
            type="number"
            step="any"
            value={values.initialValue}
            onChange={(e) =>
              setValues((v) => ({ ...v, initialValue: e.target.value }))
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="source-growth">Growth (%/yr)</Label>
          <Input
            id="source-growth"
            type="number"
            step="any"
            value={values.growth}
            onChange={(e) =>
              setValues((v) => ({ ...v, growth: e.target.value }))
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="source-start">Start date</Label>
          <Input
            id="source-start"
            type="date"
            style={{ fontSize: "0.7em" }}
            value={values.initialDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, initialDate: e.target.value }))
            }
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="source-end">End date</Label>
          <Input
            id="source-end"
            type="date"
            value={values.endDate}
            style={{ fontSize: "0.7em" }}
            onChange={(e) =>
              setValues((v) => ({ ...v, endDate: e.target.value }))
            }
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add source
      </Button>
    </form>
  );
}
