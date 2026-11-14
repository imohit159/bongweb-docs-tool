"use client";

import { useEffect, useRef, useState } from "react";

const PREVIEW_DELAY_MS = 800;

export function useDocumentPdfPreview<T>(input: T, render: (input: T) => Promise<Blob>) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(true);
  const latest = useRef(0);
  const hasPreview = useRef(false);
  useEffect(() => {
    const ticket = ++latest.current;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setRendering(true);
        try {
          const next = await render(input);
          if (!cancelled && ticket === latest.current) {
            hasPreview.current = true;
            setBlob(next);
            setError(false);
          }
        } catch {
          if (!cancelled && ticket === latest.current) setError(true);
        } finally {
          if (!cancelled && ticket === latest.current) setRendering(false);
        }
      },
      hasPreview.current ? PREVIEW_DELAY_MS : 0,
    );
    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [input, render]);
  return { blob, error, rendering };
}
