"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme/provider";

// Compact toggle for headers. One click cycles light → dark → system → light.
// We render an icon matching whatever's *currently* shown (sun for light, moon
// for dark) and a tiny pip when the user pinned "system" so they can tell that
// the displayed icon is following the OS, not a pinned choice.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolved, setTheme } = useTheme();

  function cycle() {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }

  const label =
    theme === "light" ? "Yorug' rejim" :
    theme === "dark"  ? "Tungi rejim"  :
                        "Tizimga moslashgan";

  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted ${className}`}
    >
      <Icon className="h-4 w-4" />
      {theme === "system" && (
        <Monitor className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-background p-px text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}
