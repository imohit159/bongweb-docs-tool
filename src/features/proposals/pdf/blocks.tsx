import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { STUDIO_NAME, type StudioDetails } from "@/features/studio/schema";
import { amountInWords, formatAmount, lineAmount } from "@/lib/money";
import {
  PLAN_TIERS,
  PLAN_TIER_LABELS,
  visibleTiers,
  type ClientDetails,
  type LineItem,
  type PlanComparison,
  type PlanTier,
} from "../schema";
import { PDF_COLORS, pdfStyles as s } from "./theme";
import { Wordmark } from "./wordmark";

/** The ₹ sign in a font that has it (Outfit does not). */
export function Rupee() {
  return <Text style={{ fontFamily: "Rupee" }}>₹</Text>;
}

/** A value, or a highlighted [Label] gap when it is blank. */
export function Fill({ value, label }: { value: string | null | undefined; label: string }) {
  return value?.trim() ? <>{value}</> : <Text style={s.gap}>[{label}]</Text>;
}

/** Logo on the left, the document number on the right; repeated on every page. */
export function DocHeader({ number }: { number: string }) {
  return (
    <View style={s.header} fixed>
      <Wordmark style={{ height: 18, width: 63 }} />
      <Text style={s.headerNumber}>{number}</Text>
    </View>
  );
}

/** Title and optional subtitle on the left; dates stacked on the right when given. */
export function TitleBlock({
  title,
  subtitle,
  meta,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: { label: string; value: ReactNode }[];
}) {
  return (
    <View style={s.titleBlock}>
      <View style={s.titleMain}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {meta?.length ? (
        <View style={s.titleMeta}>
          {meta.map((item) => (
            <View key={item.label} style={s.metaLine}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The first-page heading every document shares: title, subtitle, then the info row. */
export function DocumentHeading({
  title,
  subtitle,
  info,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  info: { label: string; value: ReactNode }[];
}) {
  return (
    <>
      <TitleBlock title={title} subtitle={subtitle} />
      <InfoRow items={info} />
    </>
  );
}

/** One row of label-over-value items spread edge to edge (space-between). */
export function InfoRow({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <View style={s.infoRow}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={
            index === items.length - 1
              ? { alignItems: "flex-end", flexShrink: 1, maxWidth: "50%" }
              : { flexShrink: 0 }
          }
        >
          <Text style={s.infoLabel}>{item.label}</Text>
          <Text style={[s.infoValue, index === items.length - 1 ? { textAlign: "right" } : {}]}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Parties({ studio, client }: { studio: StudioDetails; client: ClientDetails }) {
  const studioContacts = [studio.phone, studio.email, studio.website].filter(Boolean).join(" · ");
  const clientContacts = [client.phone, client.email].filter(Boolean).join(" · ");
  return (
    <View style={s.parties}>
      <View style={s.party}>
        <Text style={s.eyebrow}>FROM</Text>
        <Text style={s.partyName}>{STUDIO_NAME}</Text>
        <Text style={s.partyLine}>
          <Fill value={studio.address} label="Address, City, State" />
        </Text>
        <Text style={s.partyLine}>
          <Fill value={studioContacts} label="Phone / WhatsApp · Email · Website" />
        </Text>
      </View>
      <View style={s.party}>
        <Text style={s.eyebrow}>PREPARED FOR</Text>
        <Text style={s.partyName}>
          <Fill value={client.name} label="Client name" />
        </Text>
        <Text style={s.partyLine}>
          <Fill value={client.business} label="Business name" />
        </Text>
        {client.city ? <Text style={s.partyLine}>{client.city}</Text> : null}
        {clientContacts ? <Text style={s.partyLine}>{clientContacts}</Text> : null}
      </View>
    </View>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * The closing acceptance / approval section, pushed to the bottom of the last
 * page (just above the footer) however short the document is. It moves to a new
 * page whole if it doesn't fit.
 */
export function SignOff({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.signOff} wrap={false}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bullet}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

export function Signatures({
  clientHeading,
  signatoryName,
}: {
  clientHeading: string;
  signatoryName: string;
}) {
  const block = (heading: string, name: string | null) => (
    <View style={s.signature}>
      <Text style={[s.small, s.strong]}>{heading}</Text>
      <Text style={s.signatureLine}>Signature: ______________________</Text>
      <Text style={s.signatureLine}>Name: {name || "____________"} Date: ____________</Text>
    </View>
  );
  return (
    // Not unbreakable itself: it always sits inside a Section, which keeps it whole.
    <View style={s.signatures}>
      {block(clientHeading, null)}
      {block(`For ${STUDIO_NAME}`, signatoryName)}
    </View>
  );
}

/** Studio name and contacts on the left, page count on the right; on every page. */
export function PageFooter({ studio }: { studio: StudioDetails }) {
  const contacts = [STUDIO_NAME, studio.phone, studio.email, studio.website]
    .filter((v) => v.trim())
    .join("  ·  ");
  return (
    <>
      <Text style={[s.footerText, { left: 44, right: 140 }]} fixed>
        {contacts}
      </Text>
      <Text
        style={[s.footerText, { left: 44, right: 44, textAlign: "right" }]}
        fixed
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </>
  );
}

const ITEM_COLS = {
  n: { width: "6%" },
  item: { width: "52%" },
  qty: { width: "10%", textAlign: "right" as const },
  rate: { width: "16%", textAlign: "right" as const },
  amount: { width: "16%", textAlign: "right" as const },
};

function ItemRow({ item, index }: { item: LineItem; index: number }) {
  return (
    <View style={s.tableRow} wrap={false}>
      <Text style={[s.td, ITEM_COLS.n]}>{index + 1}</Text>
      <Text style={[s.td, ITEM_COLS.item]}>
        <Fill value={item.description} label="Item description" />
      </Text>
      <Text style={[s.td, ITEM_COLS.qty]}>{item.qty}</Text>
      <Text style={[s.td, ITEM_COLS.rate]}>
        {item.ratePaise ? formatAmount(item.ratePaise) : <Fill value="" label="0" />}
      </Text>
      <Text style={[s.td, ITEM_COLS.amount]}>{formatAmount(lineAmount(item.qty, item.ratePaise))}</Text>
    </View>
  );
}

/** # / Item / Qty / Rate / Amount with a total, amount in words and the GST note. */
export function ItemsTable({ items, heading }: { items: readonly LineItem[]; heading?: ReactNode }) {
  const total = items.reduce((sum, item) => sum + lineAmount(item.qty, item.ratePaise), 0);
  return (
    <>
      <View style={s.tableGroup}>
        <View wrap={false}>
          {heading}
          <View style={s.tableHead}>
            <Text style={[s.th, ITEM_COLS.n]}>#</Text>
            <Text style={[s.th, ITEM_COLS.item]}>Item</Text>
            <Text style={[s.th, ITEM_COLS.qty]}>Qty</Text>
            <Text style={[s.th, ITEM_COLS.rate]}>
              Rate (<Rupee />)
            </Text>
            <Text style={[s.th, ITEM_COLS.amount]}>
              Amount (<Rupee />)
            </Text>
          </View>
          {items[0] && <ItemRow item={items[0]} index={0} />}
        </View>
        {items.slice(1).map((item, index) => (
          <ItemRow key={item.id} item={item} index={index + 1} />
        ))}
        <View style={s.tableTotal} wrap={false}>
          <Text style={[s.td, ITEM_COLS.n]} />
          <Text style={[s.td, s.strong, { width: "78%" }]}>Total</Text>
          <Text style={[s.td, s.strong, ITEM_COLS.amount]}>{formatAmount(total)}</Text>
        </View>
      </View>
      <Text style={s.body}>Amount in words: {amountInWords(total)}</Text>
      <Text style={s.small}>GST not applicable: {STUDIO_NAME} is not registered under GST.</Text>
    </>
  );
}

/**
 * Bullets for the filled items; a single [label] gap when none are filled.
 * `heading` stays on the same page as the first bullet; the rest flow.
 */
export function BulletList({
  items,
  label,
  heading,
}: {
  items: readonly { text: string }[];
  label: string;
  heading?: ReactNode;
}) {
  const filled = items.filter((item) => item.text.trim());
  const [first, ...rest] = filled;
  return (
    <>
      <View wrap={false}>
        {heading}
        <Bullet>{first ? first.text : <Fill value="" label={label} />}</Bullet>
      </View>
      {rest.map((item, index) => (
        <Bullet key={index}>{item.text}</Bullet>
      ))}
    </>
  );
}

export function NumberedList({ items }: { items: readonly ReactNode[] }) {
  return (
    <>
      {items.map((item, index) => (
        <View key={index} style={s.bulletRow}>
          <Text style={[s.bullet, { width: 12 }]}>{index + 1}.</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </>
  );
}

export function SubTitle({ children }: { children: ReactNode }) {
  return <Text style={[s.body, s.strong, { marginTop: 6, marginBottom: 2 }]}>{children}</Text>;
}

/**
 * A plain table: header row, then rows; widths are percentages. `heading` stays
 * on the same page as the header and first row; later rows flow across pages,
 * each kept whole.
 */
export function SimpleTable({
  columns,
  rows,
  total,
  heading,
}: {
  columns: { label: ReactNode; width: string; align?: "left" | "right" }[];
  rows: ReactNode[][];
  total?: ReactNode[];
  heading?: ReactNode;
}) {
  const cell = (index: number) =>
    ({ width: columns[index].width, textAlign: columns[index].align ?? "left" }) as const;
  const row = (values: ReactNode[], key: number) => (
    <View key={key} style={s.tableRow} wrap={false}>
      {values.map((value, i) => (
        <Text key={i} style={[s.td, cell(i)]}>
          {value}
        </Text>
      ))}
    </View>
  );
  const [first, ...rest] = rows;
  return (
    <View style={s.tableGroup}>
      <View wrap={false}>
        {heading}
        <View style={s.tableHead}>
          {columns.map((column, i) => (
            <Text key={i} style={[s.th, cell(i)]}>
              {column.label}
            </Text>
          ))}
        </View>
        {first && row(first, 0)}
      </View>
      {rest.map((values, r) => row(values, r + 1))}
      {total && (
        <View style={s.tableTotal} wrap={false}>
          {total.map((value, i) => (
            <Text key={i} style={[s.td, s.strong, cell(i)]}>
              {value}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/** Label | value rows, as in the service blocks and the change-request header. */
export function KeyValueRows({
  rows,
  heading,
}: {
  rows: { label: string; value: ReactNode }[];
  heading?: ReactNode;
}) {
  // Flat on purpose: nesting unbreakable rows inside an unbreakable block makes
  // react-pdf misplace the content that follows. `heading` stays with row one.
  const row = (r: { label: string; value: ReactNode }, first: boolean) => (
    <View key={r.label} style={[s.tableRow, first ? { borderTopWidth: 1 } : {}]} wrap={false}>
      <Text style={[s.td, s.strong, { width: "30%" }]}>{r.label}</Text>
      <Text style={[s.td, { width: "70%" }]}>{r.value}</Text>
    </View>
  );
  const [first, ...rest] = rows;
  return (
    <View style={s.tableGroup}>
      <View wrap={false}>
        {heading}
        {first && row(first, true)}
      </View>
      {rest.map((r) => row(r, false))}
    </View>
  );
}

/**
 * Premium → Standard → Basic, or only the single price; the recommended column
 * is marked. `heading` stays with the header and first row; later rows flow.
 */
export function PlanTable({
  plans,
  priceLabel,
  heading,
}: {
  plans: PlanComparison;
  priceLabel: string;
  heading?: ReactNode;
}) {
  const tiers = visibleTiers(plans);
  const width = `${70 / tiers.length}%`;
  const headingFor = (tier: PlanTier) =>
    plans.mode === "single"
      ? "Price"
      : `${PLAN_TIER_LABELS[tier]}${tier === plans.recommended ? " (recommended)" : ""}`;
  const row = (r: PlanComparison["rows"][number]) => (
    <View key={r.id} style={s.tableRow} wrap={false}>
      <Text style={[s.td, s.strong, { width: "30%" }]}>{r.label || " "}</Text>
      {tiers.map((tier) => (
        <Text key={tier} style={[s.td, { width }]}>
          {r.values[tier] || "—"}
        </Text>
      ))}
    </View>
  );
  const [first, ...rest] = plans.rows;
  return (
    <View style={s.tableGroup}>
      <View wrap={false}>
        {heading}
        <View style={s.tableHead}>
          <Text style={[s.th, { width: "30%" }]} />
          {tiers.map((tier) => (
            <Text
              key={tier}
              style={[
                s.th,
                { width },
                tier === plans.recommended && plans.mode === "plans" ? { color: PDF_COLORS.ink } : {},
              ]}
            >
              {headingFor(tier)}
            </Text>
          ))}
        </View>
        {first && row(first)}
      </View>
      {rest.map(row)}
      <View style={s.tableTotal} wrap={false}>
        <Text style={[s.td, s.strong, { width: "30%" }]}>{priceLabel}</Text>
        {tiers.map((tier) => (
          <Text key={tier} style={[s.td, s.strong, { width }]}>
            {plans.pricePaise[tier] ? (
              <>
                <Rupee />
                {formatAmount(plans.pricePaise[tier])}
              </>
            ) : (
              <Fill value="" label="₹0" />
            )}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** "Chosen option: ☐ Premium ☐ Standard ☐ Basic" with drawn boxes (no font here has ☐). */
export function ChosenOption({ label, plans }: { label: string; plans: PlanComparison }) {
  if (plans.mode === "single") return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6 }}>
      <Text style={s.body}>{label}:</Text>
      {PLAN_TIERS.map((tier) => (
        <View key={tier} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, borderWidth: 0.8, borderColor: PDF_COLORS.ink }} />
          <Text style={s.body}>{PLAN_TIER_LABELS[tier]}</Text>
        </View>
      ))}
    </View>
  );
}
