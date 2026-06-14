import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Currency } from "@/types/wealth";
import { CURRENCY_LABELS } from "@/types/wealth";

interface CurrencySelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="currency" className="text-muted-foreground shrink-0">
        Currency
      </Label>
      <Select value={value} onValueChange={(c: Currency) => onChange(c)}>
        <SelectTrigger id="currency" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(CURRENCY_LABELS) as Currency[]).map((currency) => (
            <SelectItem key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
