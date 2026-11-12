import { Document, Page, Text, View } from "@react-pdf/renderer";
import { STUDIO_NAME, howToPay, type StudioDetails } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import { formatAmount } from "@/lib/money";
import {
  QUOTATION_PAYMENT_PERCENTS,
  QUOTATION_WORDING,
  quotationPayment,
  type QuotationContent,
  type QuotationWordingKey,
} from "../templates/quotation";
import {
  Bullet,
  DocHeader,
  Fill,
  ItemsTable,
  TitleBlock,
  PageFooter,
  Parties,
  Rupee,
  Section,
  Signatures,
} from "./blocks";
import { pdfStyles as s } from "./theme";

const day = (value: string) => (value ? formatDocDate(value) : "");

export function QuotationPdf({
  number,
  content,
  studio,
}: {
  number: string;
  content: QuotationContent;
  studio: StudioDetails;
}) {
  const wording = (key: QuotationWordingKey) => content.wording[key]?.trim() || QUOTATION_WORDING[key].text;
  const { advance, balance } = quotationPayment(content);
  const [advancePct, balancePct] = QUOTATION_PAYMENT_PERCENTS;
  const pay = howToPay(studio);

  return (
    <Document title={`Quotation ${number}`} author={STUDIO_NAME} creator={STUDIO_NAME}>
      <Page size="A4" style={s.page}>
        <DocHeader number={number} />
        <TitleBlock
          title="Quotation"
          meta={[
            { label: "Date", value: <Fill value={day(content.issueDate)} label="DD Mon YYYY" /> },
            { label: "Valid until", value: <Fill value={day(content.validUntil)} label="DD Mon YYYY" /> },
          ]}
        />
        <Parties studio={studio} client={content.client} />

        <Section title="The work">
          <Text style={s.body}>
            <Fill value={content.work.description} label="What we will do" />
          </Text>
          <Text style={[s.body, { marginTop: 4 }]}>
            <Text style={s.strong}>Included: </Text>
            <Fill value={content.work.included} label="what is included" />
          </Text>
          <Text style={s.body}>
            <Text style={s.strong}>Not included: </Text>
            <Fill value={content.work.notIncluded} label="what is not included" />.{" "}
            {wording("notIncludedSuffix")}
          </Text>
        </Section>

        <View style={s.section}>
          <ItemsTable heading={<Text style={s.sectionTitle}>Price</Text>} items={content.items} />
        </View>

        <Section title="Timeline">
          <Text style={s.body}>
            Start: <Fill value={day(content.timeline.start)} label="DD Mon YYYY" /> {wording("startNote")}
            {"      "}Delivery: <Fill value={day(content.timeline.delivery)} label="DD Mon YYYY" />
          </Text>
          <Text style={s.body}>
            We need from you: <Fill value={content.timeline.weNeed} label="logo, photos, text, logins" />
          </Text>
        </Section>

        <Section title="Payment">
          <Bullet>
            {advancePct}% advance <Rupee />
            {formatAmount(advance)} {wording("advanceWhen")}
          </Bullet>
          <Bullet>
            {balancePct}% balance <Rupee />
            {formatAmount(balance)} {wording("balanceWhen")}
          </Bullet>
          <Text style={[s.body, { marginTop: 3 }]}>
            How to pay: <Fill value={pay} label="UPI or bank details" />.
          </Text>
        </Section>

        <Section title="To accept">
          <Text style={s.body}>{wording("toAccept")}</Text>
          <Signatures clientHeading="Accepted by (Client)" signatoryName={studio.signatoryName} />
        </Section>

        <PageFooter />
      </Page>
    </Document>
  );
}
