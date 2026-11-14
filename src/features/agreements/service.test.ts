import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import { fixture } from "./test-fixtures";

const mocks = vi.hoisted(() => ({
  rows: [] as unknown[],
  updates: [] as unknown[],
  execute: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/server/db/client", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => Promise.resolve(mocks.rows) }) }),
    update: () => ({
      set: () => ({
        where: (condition: unknown) => {
          mocks.update(condition);
          return { returning: () => Promise.resolve(mocks.updates) };
        },
      }),
    }),
    execute: mocks.execute,
  },
}));
vi.mock("@/features/studio/service", () => ({ getStudioDetails: async () => EMPTY_STUDIO_DETAILS }));
import { saveAgreement, changeAgreementStatus, createAgreement } from "./service";
const id = "12345678-1234-4123-8123-123456789abc";
const actor = "test-actor";
function row(status = "draft") {
  return { id, sequence: 1, status, rowVersion: 3, content: fixture("project") };
}
beforeEach(() => {
  mocks.rows = [row()];
  mocks.updates = [];
  mocks.execute.mockReset();
  mocks.update.mockReset();
});
describe("agreement write guards", () => {
  it("refuses to edit a signed agreement", async () => {
    mocks.rows = [row("signed")];
    expect(await saveAgreement({ id, rowVersion: 3, content: fixture("project") }, actor)).toEqual({
      ok: false,
      error: "locked",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects forged proposal references and agreed prices", async () => {
    const content = fixture("project");
    content.feePaise++;
    expect(await saveAgreement({ id, rowVersion: 3, content }, actor)).toEqual({
      ok: false,
      error: "invalid",
    });
    content.feePaise--;
    content.proposal.number = "BW-P-999";
    expect(await saveAgreement({ id, rowVersion: 3, content }, actor)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("protects content writes with status and row-version checks", async () => {
    expect(await saveAgreement({ id, rowVersion: 2, content: fixture("project") }, actor)).toEqual({
      ok: false,
      error: "conflict",
    });
    const query = new PgDialect().sqlToQuery(mocks.update.mock.calls[0][0]);
    expect(query.sql).toContain('"agreements"."row_version"');
    expect(query.params).toEqual(expect.arrayContaining([id, 2, "draft"]));
  });
  it("does not mark incomplete contracts as sent", async () => {
    const r = row();
    r.content.client.address = "";
    mocks.rows = [r];
    expect(await changeAgreementStatus({ id, rowVersion: 3, to: "sent" }, actor)).toEqual({
      ok: false,
      error: "incomplete",
    });
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("keeps status changes atomic with the audit event and detects stale versions", async () => {
    mocks.execute.mockResolvedValue({ rows: [] });
    expect(await changeAgreementStatus({ id, rowVersion: 2, to: "sent" }, actor)).toEqual({
      ok: false,
      error: "conflict",
    });
    const query = new PgDialect().sqlToQuery(mocks.execute.mock.calls[0][0]);
    expect(query.sql).toContain("insert into audit_events");
    expect(query.sql).toContain("row_version=");
    expect(query.params).toEqual(expect.arrayContaining(["sent", id, 2, "draft"]));
  });
  it("rejects non-accepted or unsupported source proposals", async () => {
    mocks.rows = [];
    expect(await createAgreement(id, "standard", actor)).toEqual({ ok: false, error: "invalid" });
    mocks.rows = [{ type: "quotation" }];
    expect(await createAgreement(id, "standard", actor)).toEqual({ ok: false, error: "invalid" });
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
