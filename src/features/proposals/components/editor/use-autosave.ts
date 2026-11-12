"use client";

import { useEffect, useRef } from "react";
import { saveProposalAction } from "../../actions";
import { useEditorStoreApi } from "./editor-store";

const AUTOSAVE_DELAY_MS = 1000;

/** Saves about a second after edits stop; one save in flight at a time. */
export function useAutosave() {
  const store = useEditorStoreApi();
  const inFlight = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function save() {
      const state = store.getState();
      if (state.saveState !== "dirty" || inFlight.current) return;
      inFlight.current = true;
      const revision = state.revision;
      state.markSaving();
      try {
        const result = await saveProposalAction({
          id: state.proposal.id,
          rowVersion: state.rowVersion,
          content: state.content,
        });
        if (result.ok) store.getState().markSaved(result.value.rowVersion, revision);
        else
          store
            .getState()
            .markFailed(result.error === "conflict" || result.error === "locked" ? result.error : "error");
      } catch {
        store.getState().markFailed("error");
      } finally {
        inFlight.current = false;
      }
      // Edits made while saving start the next round.
      if (store.getState().saveState === "dirty") schedule();
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    }

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.revision !== previous.revision) schedule();
    });

    const warnOnLeave = (event: BeforeUnloadEvent) => {
      const { saveState } = store.getState();
      if (saveState === "dirty" || saveState === "saving") event.preventDefault();
    };
    window.addEventListener("beforeunload", warnOnLeave);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      window.removeEventListener("beforeunload", warnOnLeave);
      // Flush a pending edit when the editor unmounts (client-side navigation).
      if (store.getState().saveState === "dirty") void save();
    };
  }, [store]);
}
