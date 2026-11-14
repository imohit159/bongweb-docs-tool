import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { STUDIO_NAME, type StudioDetails } from "@/features/studio/schema";
import { pdfStyles as s } from "./theme";
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
