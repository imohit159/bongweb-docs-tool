"use client";
import { useEffect } from "react";
export function useUnsavedWarning(isUnsaved: () => boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isUnsaved()) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isUnsaved]);
}
