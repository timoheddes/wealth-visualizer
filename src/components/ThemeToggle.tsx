import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Theme } from "@/lib/theme";

interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-toggle" className="text-muted-foreground shrink-0">
        Theme
      </Label>
      <Button
        id="theme-toggle"
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(isDark ? "light" : "dark")}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </div>
  );
}
