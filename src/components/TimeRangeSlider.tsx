import { Slider } from "@/components/ui/slider";
import {
  formatShortDate,
  rangeToSliderValues,
  sliderValuesToRange,
} from "@/lib/wealth-calculations";
import type { TimeRange } from "@/types/wealth";

interface TimeRangeSliderProps {
  bounds: TimeRange;
  range: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSlider({
  bounds,
  range,
  onChange,
}: TimeRangeSliderProps) {
  const sliderValues = rangeToSliderValues(range, bounds);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Time range</span>
        <span className="font-medium tabular-nums">
          {formatShortDate(range.start)} — {formatShortDate(range.end)}
        </span>
      </div>
      <Slider
        min={0}
        max={100}
        step={0.5}
        value={sliderValues}
        onValueChange={(values) => {
          const [start, end] = values as [number, number];
          if (start >= end) return;
          onChange(sliderValuesToRange([start, end], bounds));
        }}
      />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{formatShortDate(bounds.start)}</span>
        <span>{formatShortDate(bounds.end)}</span>
      </div>
    </div>
  );
}
