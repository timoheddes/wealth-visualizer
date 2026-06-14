import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDateInput, toDateInputValue } from "@/lib/wealth-calculations";
import type { Source, WealthType } from "@/types/wealth";
import { DEFAULT_GROWTH_BY_TYPE, WEALTH_TYPE_LABELS } from "@/types/wealth";

interface SourceFormValues {
  type: WealthType;
  label: string;
  color: string;
  initialValue: string;
  initialDate: string;
  endDate: string;
  growth: string;
}

function sourceToValues(source: Source): SourceFormValues {
  return {
    type: source.type,
    label: source.label,
    color: source.color,
    initialValue: String(source.initialValue),
    initialDate: toDateInputValue(source.initialDate),
    endDate: toDateInputValue(source.endDate),
    growth: String(source.growth),
  };
}

interface EditSourcePopoverProps {
  source: Source;
  onSave: (source: Source) => void;
}

export function EditSourcePopover({ source, onSave }: EditSourcePopoverProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<SourceFormValues>(() =>
    sourceToValues(source),
  );

  useEffect(() => {
    if (open) {
      setValues(sourceToValues(source));
    }
  }, [open, source]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.label.trim()) return;

    onSave({
      ...source,
      type: values.type,
      label: values.label.trim(),
      color: values.color,
      initialValue: Number(values.initialValue),
      initialDate: parseDateInput(values.initialDate),
      endDate: parseDateInput(values.endDate),
      growth: Number(values.growth),
    });
    setOpen(false);
  }

  const fieldId = (field: string) => `edit-source-${field}-${source.id}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground shrink-0"
          aria-label={`Edit ${source.label}`}
        >
          <Pencil className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <h4 className="leading-none font-medium">Edit source</h4>
            <p className="text-muted-foreground mt-1 text-sm">{source.label}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={fieldId("label")}>Label</Label>
            <Input
              id={fieldId("label")}
              value={values.label}
              onChange={(e) =>
                setValues((v) => ({ ...v, label: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={fieldId("type")}>Type</Label>
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
              <SelectTrigger id={fieldId("type")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WEALTH_TYPE_LABELS) as WealthType[]).map(
                  (type) => (
                    <SelectItem key={type} value={type}>
                      {WEALTH_TYPE_LABELS[type]}
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
              <Label htmlFor={fieldId("initial")}>Initial value</Label>
              <Input
                id={fieldId("initial")}
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
              <Label htmlFor={fieldId("growth")}>Growth (%/yr)</Label>
              <Input
                id={fieldId("growth")}
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
              <Label htmlFor={fieldId("start")}>Start date</Label>
              <Input
                id={fieldId("start")}
                type="date"
                value={values.initialDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, initialDate: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("end")}>End date</Label>
              <Input
                id={fieldId("end")}
                type="date"
                value={values.endDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, endDate: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save changes
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
