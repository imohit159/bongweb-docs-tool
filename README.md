# Bongweb Agency

Internal tool for Bongweb Studio: proposals, service agreements and invoices. Next.js 16 on Vercel. No database or sign-in yet.

## Setup

```bash
pnpm install
pnpm dev
```

## Scripts

| Command      | What it does                    |
| ------------ | ------------------------------- |
| `pnpm check` | Typecheck, lint and unit tests  |
| `pnpm build` | Production build                |

## Structure

Feature-based. Each feature owns its schema, state, server actions, PDF and UI.

```
src/app/                         Routes only; pages render a feature's component
src/components/form/             Reusable form fields (text, number, lines, rows, disclosure…)
src/components/app-shell/        Sidebar and header
src/lib/                         Shared helpers: money (paise, ₹ in words), dates (IST), text, zod bounds
src/features/documents/          Shared by every document type
  pdf/                           react-pdf theme, fonts, building blocks, renderPdf()
  components/, hooks/            Live PDF preview (pdf.js), missing-fields summary, useLivePdf
src/features/studio/             Bongweb's own details: schema, zustand store, form section
src/features/proposals/          schema.ts (zod), defaults.ts, store.ts (zustand), actions.ts (server action),
                                 pdf/proposal-pdf.tsx, components/ (editor and form sections)
_templates-v0/                   The earlier file-based templates (reference only)
```

## How documents work

- The form edits a zustand store, saved in the browser (localStorage). Studio details are a separate store shared by all documents.
- A server action validates the input with zod and renders the PDF with `@react-pdf/renderer`. The same action feeds the live preview (debounced) and the download.
- Every piece of fixed wording is a field with a default, editable under "Edit wording" in each section.
- Blank required values print as highlighted `[label]` gaps and are listed above the form.

## Notes

- PDF fonts are static TTFs (SIL OFL) in `src/features/documents/pdf/fonts`, added to the `/proposals` server bundle in `next.config.ts`. A new document route needs adding there too.
- react-pdf 4.9 quirks are documented in `src/features/documents/pdf/theme.ts` (line height must be set per text style).
