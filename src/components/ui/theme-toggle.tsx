"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser; render a stable placeholder on the server.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const dark = ready && resolvedTheme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip content={label} side="bottom">
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        disabled={!ready}
        onClick={() => setTheme(dark ? "light" : "dark")}
      >
        {dark ? <IconSun /> : <IconMoon />}
      </Button>
    </Tooltip>
  );
}
