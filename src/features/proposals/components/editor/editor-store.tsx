"use client";

import { produce, type Draft } from "immer";
import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { StudioDetails } from "@/features/studio/schema";
import type { ProposalStatus } from "../../domain";
import type { AvailableProposalType, ProposalContentByType } from "../../templates";
import type { AcceptedProject } from "../../templates/change";

/** Read-only data some templates need (e.g. the Change Request's original-proposal picker). */
export interface EditorLookups {
  acceptedProjects: AcceptedProject[];
}

export type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict" | "locked";

export interface EditorProposal {
  id: string;
  type: AvailableProposalType;
  number: string;
  status: ProposalStatus;
}

export interface EditorState<C = ProposalContentByType[AvailableProposalType]> {
  proposal: EditorProposal;
  content: C;
  rowVersion: number;
  /** Bumped on every local edit, so autosave can tell whether a save is stale. */
  revision: number;
  saveState: SaveState;
  studio: StudioDetails;
  lookups: EditorLookups;
  activeSection: string;
  update(recipe: (draft: Draft<C>) => void): void;
  markSaving(): void;
  markSaved(rowVersion: number, savedRevision: number): void;
  markFailed(state: "error" | "conflict" | "locked"): void;
  /** After a failed save: marks the draft dirty again so autosave retries. */
  retrySave(): void;
  setStatus(status: ProposalStatus, rowVersion: number): void;
  setStudio(studio: StudioDetails): void;
  setActiveSection(id: string): void;
}

type InitialEditorState = Pick<
  EditorState,
  "proposal" | "content" | "rowVersion" | "studio" | "lookups" | "activeSection"
>;

function createEditorStore(initial: InitialEditorState) {
  return createStore<EditorState>()((set, get) => ({
    ...initial,
    revision: 0,
    saveState: "saved",
    update: (recipe) => {
      // Sent/accepted offers are read-only; edits are dropped rather than queued.
      if (get().proposal.status !== "draft") return;
      set((state) => ({
        content: produce(state.content, recipe),
        revision: state.revision + 1,
        saveState: state.saveState === "conflict" || state.saveState === "locked" ? state.saveState : "dirty",
      }));
    },
    markSaving: () => set({ saveState: "saving" }),
    markSaved: (rowVersion, savedRevision) =>
      set((state) => ({ rowVersion, saveState: state.revision === savedRevision ? "saved" : "dirty" })),
    markFailed: (saveState) => set({ saveState }),
    retrySave: () =>
      set((state) =>
        state.saveState === "error" ? { saveState: "dirty", revision: state.revision + 1 } : {},
      ),
    setStatus: (status, rowVersion) =>
      set((state) => ({ proposal: { ...state.proposal, status }, rowVersion })),
    setStudio: (studio) => set({ studio }),
    setActiveSection: (activeSection) => set({ activeSection }),
  }));
}

const EditorStoreContext = createContext<StoreApi<EditorState> | null>(null);

export function EditorStoreProvider({
  initial,
  children,
}: {
  initial: InitialEditorState;
  children: ReactNode;
}) {
  const [store] = useState(() => createEditorStore(initial));
  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
}

export function useEditorStoreApi() {
  const store = useContext(EditorStoreContext);
  if (!store) throw new Error("useEditor must be used inside EditorStoreProvider");
  return store;
}

export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorStoreApi(), selector);
}

/** Typed access for a template's own section components. */
export function useTemplateEditor<T extends AvailableProposalType>() {
  const content = useEditor((s) => s.content) as ProposalContentByType[T];
  const update = useEditor((s) => s.update) as (
    recipe: (draft: Draft<ProposalContentByType[T]>) => void,
  ) => void;
  const readOnly = useEditor((s) => s.proposal.status !== "draft");
  return { content, update, readOnly };
}
