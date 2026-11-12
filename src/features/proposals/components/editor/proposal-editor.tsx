"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Banner, BannerAction, BannerActions, BannerDescription, BannerTitle } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import type { StudioDetails } from "@/features/studio/schema";
import { reviseProposalAction } from "../../actions";
import { canRevise } from "../../domain";
import { getProposalTemplate, type AvailableProposalType, type ProposalContentByType } from "../../templates";
import { EditorStoreProvider, useEditor, type EditorLookups, type EditorProposal } from "./editor-store";
import { EditorTopBar } from "./editor-top-bar";
import { PreviewPanel } from "./preview-panel";
import { CHANGE_SECTION_COMPONENTS } from "./change/sections";
import { PROJECT_SECTION_COMPONENTS } from "./project/sections";
import { QUOTATION_SECTION_COMPONENTS } from "./quotation/sections";
import { RETAINER_SECTION_COMPONENTS } from "./retainer/sections";
import { SectionNav, SectionSelect } from "./section-nav";
import { useAutosave } from "./use-autosave";
import { useDownloadPdf, useMissingFields } from "./use-editor-derived";
import { usePdfPreview } from "./use-pdf-preview";
import { cn } from "@/lib/utils";

const SECTION_COMPONENTS: { [T in AvailableProposalType]: Record<string, ComponentType> } = {
  quotation: QUOTATION_SECTION_COMPONENTS,
  project: PROJECT_SECTION_COMPONENTS,
  retainer: RETAINER_SECTION_COMPONENTS,
  change: CHANGE_SECTION_COMPONENTS,
};

export interface ProposalEditorProps {
  proposal: EditorProposal;
  rowVersion: number;
  content: ProposalContentByType[AvailableProposalType];
  studio: StudioDetails;
  lookups: EditorLookups;
}

export function ProposalEditor(props: ProposalEditorProps) {
  const firstSection = getProposalTemplate(props.proposal.type).sections[0].id;
  return (
    <EditorStoreProvider initial={{ ...props, activeSection: firstSection }}>
      <EditorBody />
    </EditorStoreProvider>
  );
}

function EditPanel({ className }: { className?: string }) {
  const type = useEditor((s) => s.proposal.type);
  const active = useEditor((s) => s.activeSection);
  const setActive = useEditor((s) => s.setActiveSection);
  const sections = getProposalTemplate(type).sections;
  const index = sections.findIndex((s) => s.id === active);
  const Section = SECTION_COMPONENTS[type][active];
  const prev = sections[index - 1];
  const next = sections[index + 1];
  const scrollTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollTop.current?.scrollIntoView({ block: "start" });
  }, [active]);

  return (
    <section
      aria-labelledby="editor-section-title"
      className={cn("border-border min-h-0 flex-col @5xl:border-l", className)}
    >
      <SectionSelect className="px-4 pt-3 @5xl:hidden" />
      <ScrollArea className="min-h-0 flex-1">
        <div ref={scrollTop} className="flex flex-col gap-5 px-4 py-4">
          <h2 id="editor-section-title" className="text-base font-semibold">
            {sections[index].label}
          </h2>
          <Section />
          <div className="flex justify-between gap-2 pt-2">
            {prev ? (
              <Button
                variant="ghost"
                size="compact"
                leadingIcon={ChevronLeft}
                onClick={() => setActive(prev.id)}
              >
                {prev.label}
              </Button>
            ) : (
              <span />
            )}
            {next && (
              <Button
                variant="tertiary"
                size="compact"
                trailingIcon={ChevronRight}
                onClick={() => setActive(next.id)}
              >
                {next.label}
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}

function EditorBanners({
  showMissing,
  onCloseMissing,
  onDownloadAnyway,
  error,
  onCloseError,
}: {
  showMissing: boolean;
  onCloseMissing: () => void;
  onDownloadAnyway: () => void;
  error: string | null;
  onCloseError: () => void;
}) {
  const router = useRouter();
  const proposal = useEditor((s) => s.proposal);
  const saveState = useEditor((s) => s.saveState);
  const setActive = useEditor((s) => s.setActiveSection);
  const missing = useMissingFields();
  const [revising, setRevising] = useState(false);

  const list = [
    ...missing.fields.map((f) => f.label),
    ...missing.studioFields.map((f) => `Studio: ${f.label}`),
  ];

  return (
    <div className="flex flex-col gap-2 px-4 empty:hidden [&:not(:empty)]:pt-3">
      {saveState === "conflict" && (
        <Banner status="warning">
          <BannerTitle>This offer was changed in another tab or by someone else</BannerTitle>
          <BannerDescription>
            Your latest edits were not saved. Reload to continue from the saved version.
          </BannerDescription>
          <BannerActions>
            <BannerAction variant="primary" onClick={() => window.location.reload()}>
              Reload
            </BannerAction>
          </BannerActions>
        </Banner>
      )}
      {proposal.status !== "draft" && (
        <Banner status="info">
          <BannerTitle>
            {proposal.status === "replaced"
              ? "A newer version replaces this offer"
              : "Sent and accepted offers are read-only"}
          </BannerTitle>
          {canRevise(proposal.status) && (
            <>
              <BannerDescription>
                To change the scope or price, create a revision. This version is kept as it was sent.
              </BannerDescription>
              <BannerActions>
                <BannerAction
                  variant="primary"
                  loading={revising}
                  onClick={async () => {
                    setRevising(true);
                    const result = await reviseProposalAction(proposal.id).catch(() => null);
                    if (result?.ok) router.push(`/proposals/${result.value.id}`);
                    else setRevising(false);
                  }}
                >
                  Revise
                </BannerAction>
              </BannerActions>
            </>
          )}
        </Banner>
      )}
      {error && (
        <Banner status="warning" dismissible onDismiss={onCloseError}>
          <BannerTitle>{error}</BannerTitle>
        </Banner>
      )}
      {showMissing && missing.total > 0 && (
        <Banner status="warning" dismissible onDismiss={onCloseMissing}>
          <BannerTitle>
            {missing.total} required {missing.total === 1 ? "field is" : "fields are"} empty
          </BannerTitle>
          <BannerDescription>
            {list.slice(0, 6).join(" · ")}
            {list.length > 6 ? ` · and ${list.length - 6} more` : ""}
          </BannerDescription>
          <BannerActions>
            {missing.fields[0] && (
              <BannerAction
                variant="secondary"
                onClick={() => {
                  setActive(missing.fields[0].section);
                  onCloseMissing();
                }}
              >
                Go to first
              </BannerAction>
            )}
            <BannerAction variant="ghost" onClick={onDownloadAnyway}>
              Download draft anyway
            </BannerAction>
          </BannerActions>
        </Banner>
      )}
    </div>
  );
}

function EditorBody() {
  useAutosave();
  const preview = usePdfPreview();
  const download = useDownloadPdf();
  const missing = useMissingFields();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<0 | 1>(0);
  const [showMissing, setShowMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDownload() {
    setShowMissing(false);
    try {
      await download();
    } catch (err) {
      console.error("PDF download failed", err);
      setError("Could not build the PDF. Try again.");
    }
  }

  function requestDownload() {
    if (missing.total > 0) setShowMissing(true);
    else void runDownload();
  }

  // ?download=1 (from the list) downloads once, then drops the flag.
  const downloadRequested = searchParams.get("download") === "1";
  useEffect(() => {
    if (!downloadRequested) return;
    router.replace(window.location.pathname, { scroll: false });
    download().catch((err) => {
      console.error("PDF download failed", err);
      setError("Could not build the PDF. Try again.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadRequested]);

  return (
    // The outer element is the size container; the grid inside queries it.
    <div className="@container flex min-h-0 flex-1 flex-col">
      <EditorTopBar onDownload={requestDownload} onError={setError} />
      <EditorBanners
        showMissing={showMissing}
        onCloseMissing={() => setShowMissing(false)}
        onDownloadAnyway={() => void runDownload()}
        error={error}
        onCloseError={() => setError(null)}
      />
      <div className="px-4 pt-3 @3xl:hidden">
        <Tabs selectedIndex={view} onSelect={(i) => setView(i as 0 | 1)} idPrefix="editor-view">
          <TabsItem index={0} label="Edit" />
          <TabsItem index={1} label="Preview" />
        </Tabs>
      </div>
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          "@3xl:grid-cols-[clamp(20rem,40cqi,32rem)_minmax(0,1fr)]",
          "@5xl:grid-cols-[clamp(9rem,11cqi,12rem)_clamp(22rem,33cqi,32rem)_minmax(45cqi,1fr)]",
        )}
      >
        <SectionNav className="hidden @5xl:flex" />
        <EditPanel className={cn(view === 0 ? "flex" : "hidden", "@3xl:flex")} />
        <PreviewPanel
          className={cn(view === 1 ? "flex" : "hidden", "@3xl:flex")}
          blob={preview.blob}
          error={preview.error}
          rendering={preview.rendering}
        />
      </div>
    </div>
  );
}
