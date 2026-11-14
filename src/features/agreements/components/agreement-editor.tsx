"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { produce, type Draft } from "immer";
import {
  IconArrowLeft,
  IconDownload,
  IconDeviceFloppy,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import { Banner, BannerTitle, BannerDescription } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { DocumentSectionNav } from "@/features/documents/components/section-nav";
import { Field, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import { DateField } from "@/features/documents/components/fields/date-field";
import { TextField } from "@/features/documents/components/fields/text-field";
import { NumberInput } from "@/features/documents/components/fields/number-input";
import { PreviewPanel } from "@/features/documents/components/preview-panel";
import { useDocumentPdfPreview } from "@/features/documents/hooks/use-pdf-preview";
import { useUnsavedWarning } from "@/features/documents/hooks/use-unsaved-warning";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { changeAgreementStatusAction, saveAgreementAction } from "../actions";
import {
  AGREEMENT_STATUS_LABELS,
  AGREEMENT_TRANSITIONS,
  AGREEMENT_TYPE_LABELS,
  formatAgreementNumber,
  type AgreementStatus,
} from "../domain";
import type { AgreementContent } from "../schema";
import type { AgreementDetail } from "../service";
import {
  AGREEMENT_SECTIONS,
  agreementClauseGroups,
  findMissingAgreementFieldDetails,
  type AgreementSection,
} from "../template";
import type { AgreementPdfInput } from "../pdf/agreement-pdf";
import { AgreementStatusBadge } from "./agreements-list";

async function render(input: AgreementPdfInput) {
  const { renderAgreementPdf } = await import("../pdf/render");
  return renderAgreementPdf(input);
}
export function AgreementEditor({ agreement }: { agreement: AgreementDetail }) {
  const router = useRouter();
  const [content, setContent] = useState(agreement.content);
  const [rowVersion, setRowVersion] = useState(agreement.rowVersion);
  const [status, setStatus] = useState(agreement.status);
  const [active, setActive] = useState<AgreementSection>("details");
  const [view, setView] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const dirtyRef = useRef(false);
  const busyRef = useRef(false);
  const isUnsaved = useCallback(() => dirtyRef.current, []);
  useUnsavedWarning(isUnsaved);
  const number = formatAgreementNumber(agreement.sequence);
  const input = useMemo(() => ({ number, content }), [number, content]);
  const preview = useDocumentPdfPreview(input, render);
  const readOnly = status !== "draft" || pending || blocked;
  const groups = agreementClauseGroups(content);
  const selected = groups.find((g) => g.id === active);
  const missingFields = findMissingAgreementFieldDetails(content);
  const missing = missingFields.map((field) => field.label);
  const missingBySection = new Map<AgreementSection, number>();
  for (const field of missingFields) {
    missingBySection.set(field.section, (missingBySection.get(field.section) ?? 0) + 1);
  }
  const sectionIndex = AGREEMENT_SECTIONS.findIndex((section) => section.id === active);
  const previousSection = AGREEMENT_SECTIONS[sectionIndex - 1];
  const nextSection = AGREEMENT_SECTIONS[sectionIndex + 1];
  const sectionTop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sectionTop.current?.scrollIntoView({ block: "start" });
  }, [active]);

  function update(recipe: (draft: Draft<AgreementContent>) => void) {
    if (readOnly) return;
    setContent((c) => produce(c, recipe));
    setDirty(true);
    dirtyRef.current = true;
  }
  async function save() {
    if (busyRef.current || blocked || status !== "draft") return false;
    if (!dirtyRef.current) return true;
    busyRef.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await saveAgreementAction({ id: agreement.id, rowVersion, content });
      if (result.ok) {
        setRowVersion(result.value.rowVersion);
        setDirty(false);
        dirtyRef.current = false;
        return true;
      }
      if (result.error === "conflict" || result.error === "locked") {
        setBlocked(true);
        setError(
          "This agreement changed elsewhere. Your edits were not saved. Reload to continue from the saved version.",
        );
      } else
        setError(
          result.error === "unauthorized"
            ? "Your session ended. Sign in again."
            : "Could not save. Check the field values and try again.",
        );
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      busyRef.current = false;
      setPending(false);
    }
    return false;
  }
  async function changeStatus(to: AgreementStatus) {
    if (dirtyRef.current || busyRef.current || blocked) return;
    busyRef.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await changeAgreementStatusAction({ id: agreement.id, rowVersion, to });
      if (result.ok) {
        setStatus(result.value.status);
        setRowVersion(result.value.rowVersion);
        router.refresh();
      } else if (result.error === "incomplete")
        setError(
          `Complete the required details before marking as ${AGREEMENT_STATUS_LABELS[to].toLowerCase()}.`,
        );
      else {
        setBlocked(true);
        setError("Could not change status. Reload to check the latest version.");
      }
    } catch {
      setError("Could not change status. Check your connection and try again.");
    } finally {
      busyRef.current = false;
      setPending(false);
    }
  }
  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const blob = await render(input);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${number}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Could not build the PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }
  const text = (
    label: string,
    value: string,
    change: (c: Draft<AgreementContent>, v: string) => void,
    options: { multiline?: boolean; maxLength?: number; required?: boolean; type?: "email" } = {},
  ) => (
    <TextField
      label={label}
      value={value}
      onChange={(v) => update((c) => change(c, v))}
      readOnly={readOnly}
      maxLength={options.maxLength ?? 160}
      {...options}
    />
  );
  const date = (
    label: string,
    key: "issueDate" | "startDate" | "deliveryDate" | "clientSignDate" | "providerSignDate",
    required = false,
  ) => (
    <DateField
      label={label}
      value={content[key]}
      onChange={(v) =>
        update((c) => {
          c[key] = v;
        })
      }
      readOnly={readOnly}
      required={required}
    />
  );
  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      <header className="border-border flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon-compact"
          aria-label="Back to agreements"
          disabled={pending}
          onClick={async () => {
            if (!dirtyRef.current || (await save())) router.push("/agreements");
          }}
        >
          <IconArrowLeft />
        </Button>
        <div>
          <p className="text-muted-foreground text-xs">{AGREEMENT_TYPE_LABELS[content.type]}</p>
          <h1 className="text-sm font-semibold">{number}</h1>
        </div>
        {AGREEMENT_TRANSITIONS[status].length ? (
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button
                  variant="ghost"
                  size="compact"
                  trailingIcon={IconChevronDown}
                  disabled={pending || blocked}
                  aria-label="Change status"
                >
                  <AgreementStatusBadge status={status} />
                </Button>
              }
            />
            <DropdownContent align="start" className="w-56">
              {AGREEMENT_TRANSITIONS[status].map((to, index) => (
                <MenuItem
                  key={to}
                  index={index}
                  label={
                    to === "draft" ? "Back to draft" : `Mark as ${AGREEMENT_STATUS_LABELS[to].toLowerCase()}`
                  }
                  disabled={pending || dirty || blocked || (to !== "draft" && missing.length > 0)}
                  onSelect={() => changeStatus(to)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        ) : (
          <AgreementStatusBadge status={status} />
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span role="status" aria-live="polite" className="text-muted-foreground text-xs">
            {blocked
              ? "Changed elsewhere"
              : status !== "draft"
                ? "Read-only"
                : pending
                  ? "Saving…"
                  : dirty
                    ? "Unsaved changes"
                    : "Saved"}
          </span>
          {status === "draft" && (
            <Button
              variant="tertiary"
              size="compact"
              leadingIcon={IconDeviceFloppy}
              disabled={!dirty || blocked}
              loading={pending}
              onClick={save}
            >
              Save
            </Button>
          )}
          <Button size="compact" leadingIcon={IconDownload} loading={downloading} onClick={download}>
            {status === "draft" ? "Download draft" : "Download PDF"}
          </Button>
        </div>
      </header>
      {(error || status !== "draft" || missing.length > 0) && (
        <div className="flex flex-col gap-2 px-4 pt-3">
          {error && (
            <Banner status="warning">
              <BannerTitle>{error}</BannerTitle>
              {blocked && (
                <Button variant="tertiary" size="compact" onClick={() => window.location.reload()}>
                  Reload
                </Button>
              )}
            </Banner>
          )}
          {status !== "draft" && (
            <Banner status="info">
              <BannerTitle>
                {status === "signed" ? "Signed agreement is read-only" : "Sent agreement is read-only"}
              </BannerTitle>
              <BannerDescription>
                {status === "signed"
                  ? "Signed records keep the agreed terms and party details."
                  : "Return to draft before editing. Mark as signed after both parties have signed the document."}
              </BannerDescription>
            </Banner>
          )}
          {status === "draft" && missing.length > 0 && (
            <Banner status="warning">
              <BannerTitle>{missing.length} details to complete before sending</BannerTitle>
              <BannerDescription>
                {missing.join(" · ")}. Draft downloads show placeholders for blank fields.
              </BannerDescription>
            </Banner>
          )}
        </div>
      )}
      <div className="px-4 pt-3 @3xl:hidden">
        <Tabs selectedIndex={view} onSelect={setView} idPrefix="agreement-view">
          <TabsItem index={0} label="Edit" />
          <TabsItem index={1} label="Preview" />
        </Tabs>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 @3xl:grid-cols-[clamp(20rem,40cqi,32rem)_minmax(0,1fr)] @5xl:grid-cols-[clamp(9rem,11cqi,12rem)_clamp(22rem,33cqi,32rem)_minmax(45cqi,1fr)]">
        <DocumentSectionNav
          bySection={missingBySection}
          sections={AGREEMENT_SECTIONS}
          active={active}
          onSelect={setActive}
          className="hidden @5xl:flex"
        />
        <section
          aria-label="Edit agreement"
          className={cn(
            "border-border min-h-0 flex-col @5xl:border-l",
            view === 0 ? "flex" : "hidden",
            "@3xl:flex",
          )}
        >
          <div className="px-4 pt-3 @5xl:hidden">
            <Select value={active} onValueChange={(v) => setActive(v as AgreementSection)}>
              <SelectTrigger aria-label="Agreement section" className="w-full" />
              <SelectContent>
                {AGREEMENT_SECTIONS.map((s, i) => (
                  <SelectItem key={s.id} index={i} value={s.id}>
                    {s.label}
                    {missingBySection.get(s.id) ? ` · ${missingBySection.get(s.id)} to fill` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div ref={sectionTop} className="flex flex-col gap-5 px-4 py-4">
              <h2 className="text-base font-semibold">
                {AGREEMENT_SECTIONS.find((s) => s.id === active)!.label}
              </h2>
              {active === "details" && (
                <>
                  <p className="text-muted-foreground text-sm">
                    Accepted proposal:{" "}
                    <Link className="underline underline-offset-4" href={`/proposals/${content.proposal.id}`}>
                      {content.proposal.number}
                    </Link>{" "}
                    · {content.proposal.option} · {formatInr(content.feePaise)}
                    {content.type === "retainer" ? " / month" : ""}. The selected option and fee come from
                    this proposal.
                  </p>
                  {text(
                    "Project or plan name",
                    content.title,
                    (c, v) => {
                      c.title = v;
                    },
                    { required: true },
                  )}
                  {date("Agreement date", "issueDate", true)}
                  <h3 className="font-medium">Bongweb Studio</h3>
                  <p className="text-muted-foreground text-sm">
                    These details were copied from studio settings. Edits here apply only to this agreement.
                  </p>
                  {text(
                    "Proprietor and signatory name",
                    content.provider.legalName,
                    (c, v) => {
                      c.provider.legalName = v;
                    },
                    { required: true, maxLength: 120 },
                  )}
                  {text(
                    "Provider address",
                    content.provider.address,
                    (c, v) => {
                      c.provider.address = v;
                    },
                    { required: true, multiline: true, maxLength: 300 },
                  )}
                  {text(
                    "Provider email",
                    content.provider.email,
                    (c, v) => {
                      c.provider.email = v;
                    },
                    { required: true, type: "email" },
                  )}
                  {text(
                    "Provider signatory role",
                    content.provider.role,
                    (c, v) => {
                      c.provider.role = v;
                    },
                    { maxLength: 80 },
                  )}
                  <h3 className="font-medium">Client</h3>
                  {text(
                    "Client signatory name",
                    content.client.name,
                    (c, v) => {
                      c.client.name = v;
                    },
                    { required: true, maxLength: 120 },
                  )}
                  {text("Client legal or business name", content.client.business, (c, v) => {
                    c.client.business = v;
                  })}
                  {text(
                    "Client address",
                    content.client.address,
                    (c, v) => {
                      c.client.address = v;
                    },
                    { required: true, multiline: true, maxLength: 300 },
                  )}
                  {text(
                    "Client email",
                    content.client.email,
                    (c, v) => {
                      c.client.email = v;
                    },
                    { required: true, type: "email" },
                  )}
                  {text(
                    "Client signatory role",
                    content.client.role,
                    (c, v) => {
                      c.client.role = v;
                    },
                    { maxLength: 80 },
                  )}
                </>
              )}
              {active === "work" &&
                (content.type === "project"
                  ? date("Estimated delivery", "deliveryDate", true)
                  : date("Service start date", "startDate", true))}
              {active === "payment" && (
                <>
                  <p className="text-sm font-medium">
                    Agreed fee: {formatInr(content.feePaise)}
                    {content.type === "retainer" ? " / month" : ""}
                  </p>
                  {content.type === "project" ? (
                    <p className="text-muted-foreground text-sm">
                      50% advance · 40% on design / beta approval · 10% before go-live and handover.
                    </p>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor="fee-due-day">Payment due day of each month</FieldLabel>
                      <NumberInput
                        id="fee-due-day"
                        value={content.feeDueDay}
                        readOnly={readOnly}
                        onValueChange={(v) =>
                          update((c) => {
                            c.feeDueDay = v;
                          })
                        }
                      />
                    </Field>
                  )}
                </>
              )}
              {active === "ending" && (
                <>
                  {text(
                    "Courts at city and state",
                    content.jurisdiction,
                    (c, v) => {
                      c.jurisdiction = v;
                    },
                    { required: true, maxLength: 100 },
                  )}
                  {content.type === "retainer" && (
                    <Field>
                      <FieldLabel htmlFor="minimum-term">Minimum term in months</FieldLabel>
                      <NumberInput
                        id="minimum-term"
                        value={content.minimumTermMonths}
                        readOnly={readOnly}
                        onValueChange={(v) =>
                          update((c) => {
                            c.minimumTermMonths = v;
                          })
                        }
                      />
                    </Field>
                  )}
                </>
              )}
              {selected?.clauses.map((clause) => (
                <div key={clause.id} className="flex flex-col gap-2">
                  <TextField
                    label={clause.label}
                    value={clause.text}
                    multiline
                    rows={4}
                    maxLength={1600}
                    readOnly={readOnly}
                    onChange={(v) =>
                      update((c) => {
                        c.wording[clause.id] = v;
                      })
                    }
                  />
                  {content.wording[clause.id] !== undefined && (
                    <Button
                      variant="ghost"
                      size="compact"
                      disabled={readOnly}
                      onClick={() =>
                        update((c) => {
                          delete c.wording[clause.id];
                        })
                      }
                    >
                      Reset to template
                    </Button>
                  )}
                </div>
              ))}
              {active === "acceptance" && (
                <>
                  {date("Client signing date", "clientSignDate")}
                  {date("Provider signing date", "providerSignDate")}
                  <p className="text-muted-foreground text-sm">
                    Leave signing dates blank for the parties to fill when they sign. Marking as signed
                    records the status; it does not add a digital signature.
                  </p>
                </>
              )}
              <div className="flex justify-between gap-2 pt-2">
                {previousSection ? (
                  <Button
                    variant="ghost"
                    size="compact"
                    leadingIcon={IconChevronLeft}
                    onClick={() => setActive(previousSection.id)}
                  >
                    {previousSection.label}
                  </Button>
                ) : (
                  <span />
                )}
                {nextSection && (
                  <Button
                    variant="tertiary"
                    size="compact"
                    trailingIcon={IconChevronRight}
                    onClick={() => setActive(nextSection.id)}
                  >
                    {nextSection.label}
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </section>
        <PreviewPanel className={cn(view === 1 ? "flex" : "hidden", "@3xl:flex")} {...preview} />
      </div>
    </div>
  );
}
