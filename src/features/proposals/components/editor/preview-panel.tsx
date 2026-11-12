"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Banner, BannerDescription, BannerTitle } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs() {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return pdfjs;
  });
  return pdfjsPromise;
}

/** Draws every page of the PDF to canvases at fit-to-width × zoom. */
export function PreviewPanel({
  blob,
  error,
  rendering,
  className,
}: {
  blob: Blob | null;
  error: boolean;
  rendering: boolean;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(ZOOM_STEPS.indexOf(1));
  const [pageCount, setPageCount] = useState(0);
  const zoom = ZOOM_STEPS[zoomIndex];

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!blob || width === 0) return;
    let cancelled = false;
    (async () => {
      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
      const doc = await task.promise;
      // Draw offscreen, then swap, so an update never flashes an empty page.
      const canvases: HTMLCanvasElement[] = [];
      const ratio = window.devicePixelRatio || 1;
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * zoom * ratio });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${viewport.width / ratio}px`;
        canvas.className = "block max-w-none rounded-sm bg-white shadow-sm ring-1 ring-black/5";
        canvas.setAttribute("aria-label", `Page ${n} of ${doc.numPages}`);
        canvas.setAttribute("role", "img");
        await page.render({ canvas, viewport }).promise;
        canvases.push(canvas);
      }
      await task.destroy();
      if (cancelled || !pagesRef.current) return;
      pagesRef.current.replaceChildren(...canvases);
      setPageCount(canvases.length);
    })().catch((err) => console.error("PDF draw failed", err));
    return () => {
      cancelled = true;
    };
  }, [blob, width, zoom]);

  return (
    <section aria-label="Live preview" className={cn("bg-muted/40 min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {rendering ? "Updating…" : pageCount ? `${pageCount} ${pageCount === 1 ? "page" : "pages"}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip content="Zoom out">
            <Button
              variant="ghost"
              size="icon-compact"
              aria-label="Zoom out"
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex((i) => i - 1)}
            >
              <IconMinus />
            </Button>
          </Tooltip>
          <Button variant="ghost" size="compact" onClick={() => setZoomIndex(ZOOM_STEPS.indexOf(1))}>
            {zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
          </Button>
          <Tooltip content="Zoom in">
            <Button
              variant="ghost"
              size="icon-compact"
              aria-label="Zoom in"
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              onClick={() => setZoomIndex((i) => i + 1)}
            >
              <IconPlus />
            </Button>
          </Tooltip>
        </div>
      </div>
      {error && (
        <div className="px-4 pb-2">
          <Banner status="warning">
            <BannerTitle>Preview could not update</BannerTitle>
            <BannerDescription>Your changes are still saved. Keep editing to try again.</BannerDescription>
          </Banner>
        </div>
      )}
      <ScrollArea
        orientation="both"
        className="min-h-0 flex-1"
        viewportClassName="focus-visible:outline-none"
      >
        <div className="px-[4cqi] pb-6">
          <div ref={frameRef} className="w-full">
            <div ref={pagesRef} className="flex flex-col items-center gap-4" />
            {!blob && !error && (
              <div className="aspect-[1/1.414] w-full animate-pulse rounded-sm bg-white/60" />
            )}
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}
