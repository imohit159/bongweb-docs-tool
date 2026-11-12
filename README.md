# Bongweb Agency

Internal tool for Bongweb Studio: proposals, service agreements and invoices. Next.js 16 with Neon Postgres and managed Better Auth. Document features are currently scaffolded.

## Setup

```bash
pnpm install
pnpm dev
```

## Authentication

Managed Better Auth is enabled on the linked Neon production branch. Run `neon link` for a fresh checkout, then `neon env pull` to fetch the branch variables into the ignored `.env` file. Use `neon deploy` to reconcile `neon.ts`; this provisions services, not application Drizzle tables.

Required auth variables: `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`. Generate a cookie secret of at least 32 characters locally and keep it out of source control. `.env.example` lists the required names. For a hosted deployment, set these in the hosting provider's environment and register its trusted domain in Neon Auth.

- Public signup is disabled in Neon. Accounts are provisioned administratively.
- `/auth/sign-in`: email/password sign-in.
- Successful login opens `/proposals` inside the authenticated dashboard. User identity and sign-out are in the sidebar.
- `/api/me`: returns the current user's public identity, or 401; never returns tokens.
- Dashboard routes require authentication through both the proxy and server layout.
- Managed credentials and sessions belong to `neon_auth`. The obsolete local auth schema and migration have been removed from the repo; their tables still exist, unused, in production (see `docs/auth-schema.md`). Drizzle owns only application tables; audit actors store opaque Neon user IDs without a provider-table foreign key. Application tables are defined in `src/server/db/schema.ts`; their migrations (`drizzle/0000_audit_events.sql`, `drizzle/0001_proposals.sql`) were applied to the production branch on 13 Nov 2026. See `docs/proposals-schema.md`.

Verified against the real managed service on 2026-11-12: UI signup, matching current-user readback, reload persistence, sign-out, incorrect-password feedback, sign-in, protected API/dashboard access, and mobile layout. A generated test account was created on production and signed out; its password was never printed. Email verification was not exercised because the current Neon configuration does not require or send verification at signup.

## Scripts

| Command      | What it does                   |
| ------------ | ------------------------------ |
| `pnpm check` | Typecheck, lint and unit tests |
| `pnpm build` | Production build               |

## Database

Drizzle generates SQL locally (`pnpm exec drizzle-kit generate`); `drizzle.config.ts` holds no credentials. Apply the files in `drizzle/` in order to the target Neon branch (for example `psql "$DATABASE_URL" -f drizzle/0000_audit_events.sql -f drizzle/0001_proposals.sql`). Test on a Neon branch before production.

| Table               | Holds                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proposals`         | Every offer of all four types. List columns (title, client, total, date) are derived from `content` (jsonb, zod-validated per type) on each save. |
| `proposal_counters` | Last number used per type; incremented in the same statement that creates the draft.                                                              |
| `studio_settings`   | One row: Bongweb's address, contacts, UPI/bank and signatory, printed on every document.                                                          |
| `audit_events`      | Create, status change, revise and studio-details updates, written in the same statement as the change.                                            |

## Structure

Feature-based. Each feature owns its schema, use cases, server actions and UI.

```
src/app/                           Routes only; pages render a feature's component
src/components/ui/                 Fluid Functionalism components (Base UI)
src/components/app-shell/          Sidebar and header (the editor route collapses the sidebar)
src/lib/                           money (paise, ₹ in words, splits), dates (IST calendar days)
src/server/                        env config, Neon Auth, Drizzle schema and client
src/features/audit/                SQL fragment that records an audit event inside a write
src/features/studio/               Studio details: schema, service, action
src/features/proposals/
  domain.ts                        Types, numbers, statuses and allowed status changes
  schema.ts                        Shared zod fragments (client, line items, wording overrides)
  templates/                       One module per template: content schema, sections, wording,
                                   defaults, missing fields, list summary (all four types)
  service.ts, actions.ts           Use cases (single-statement SQL) and authenticated server actions
  pdf/                             react-pdf theme, fonts, blocks, wordmark, one document per template
  components/                      List, offer chooser, and editor/ (store, autosave, preview, sections)
docs/proposal-templates-v3/        The source templates and the sales flow
```

## How documents work

- **New offer:** creates a draft in Postgres with its number (`BW-Q-001`) assigned straight away.
- **Editing:** the editor keeps the draft in a zustand store. About 1 s after typing stops, a server action validates it with the template's zod schema and saves it. Each save carries `row_version`; if another tab saved first, the editor asks to reload instead of overwriting.
- **Preview and download:** the PDF is built in the browser with `@react-pdf/renderer` about 0.8 s after edits stop, and drawn with pdf.js. Download builds a fresh PDF from the latest content.
- **Fixed wording:** each piece has a default, editable per document under "Edit wording". Blank falls back to the default.
- **Missing fields:** blank required values print as highlighted `[label]` gaps, are counted per section, and are listed before download.
- **Statuses:** Draft → Sent → Accepted (Sent can go back to Draft). Only drafts are editable. "Revise" copies a sent or accepted offer as `v2` and marks the old one Replaced.

## Notes

- PDF fonts live in `public/fonts/pdf` (SIL OFL). Outfit has no ₹ glyph, so `NotoSansRupee-*.ttf` is a one-glyph subset used only for the sign.
- react-pdf 4.9 quirks are documented in `src/features/proposals/pdf/theme.ts`: set line height per text style, and never on the page or the page-number text.
- A Change Request can link to an accepted Project Proposal (it fills the client and project) or describe one made outside the app. The link is checked when it is set and kept if that project is revised later.
