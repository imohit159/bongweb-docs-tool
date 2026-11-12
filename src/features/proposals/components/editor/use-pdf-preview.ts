"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "./editor-store";

const PREVIEW_DELAY_MS = 800;

/** Re-renders the PDF in the browser after edits settle; stale renders are discarded. */
export function usePdfPreview() {
  const proposal = useEditor((s) => s.proposal);
  const content = useEditor((s) => s.content);
  const studio = useEditor((s) => s.studio);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(true);
  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
    const timer = setTimeout(
      async () => {
        setRendering(true);
        try {
          const { renderProposalPdf } = await import("../../pdf/render");
          const next = await renderProposalPdf({
            type: proposal.type,
            number: proposal.number,
            content,
            studio,
          });
          if (ticket === latest.current) {
            setBlob(next);
            setError(false);
          }
        } catch (err) {
          console.error("PDF preview failed", err);
          if (ticket === latest.current) setError(true);
        } finally {
          if (ticket === latest.current) setRendering(false);
        }
      },
      blob ? PREVIEW_DELAY_MS : 0,
    );
    return () => clearTimeout(timer);
    // `blob` only picks the first render's delay; it must not retrigger renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.type, proposal.number, content, studio]);

  return { blob, error, rendering };
}
