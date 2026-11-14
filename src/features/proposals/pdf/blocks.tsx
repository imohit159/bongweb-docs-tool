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
import { Fill, Rupee } from "@/features/documents/pdf/blocks";
export {
  Rupee,
  Fill,
  DocHeader,
  TitleBlock,
  DocumentHeading,
  InfoRow,
  Section,
  SignOff,
  Bullet,
  Signatures,
  PageFooter,
  BulletList,
  NumberedList,
  SubTitle,
  SimpleTable,
  KeyValueRows,
} from "@/features/documents/pdf/blocks";

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
