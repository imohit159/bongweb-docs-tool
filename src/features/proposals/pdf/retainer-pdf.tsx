import { Document, Page, Text, View } from "@react-pdf/renderer";
import { STUDIO_NAME, howToPay, type StudioDetails } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import {
  RETAINER_WORDING,
  generatedRetainerTerms,
  type RetainerContent,
  type RetainerWordingKey,
} from "../templates/retainer";
import {
  Bullet,
  BulletList,
  ChosenOption,
  DocHeader,
  Fill,
  DocumentHeading,
  NumberedList,
  PageFooter,
  PlanTable,
  Section,
  SignOff,
  Signatures,
  SimpleTable,
  SubTitle,
} from "./blocks";
import { pdfStyles as s } from "./theme";

const day = (value: string) => (value ? formatDocDate(value) : "");

export function RetainerPdf({
  number,
  content,
  studio,
}: {
  number: string;
  content: RetainerContent;
  studio: StudioDetails;
}) {
  const wording = (key: RetainerWordingKey) => content.wording[key]?.trim() || RETAINER_WORDING[key].text;
  const client = [content.client.name, content.client.business].filter((v) => v.trim()).join(", ");
  const deliverables = content.deliverables.filter((d) => d.item.trim() || d.perMonth.trim());
  const months = `${content.minimumTermMonths} ${content.minimumTermMonths === 1 ? "month" : "months"}`;

  return (
    <Document title={`Retainer Proposal ${number}`} author={STUDIO_NAME} creator={STUDIO_NAME}>
      <Page size="A4" style={s.page}>
        <DocHeader number={number} />
        <DocumentHeading
          title="Retainer Proposal"
          info={[
            { label: "DATE", value: <Fill value={day(content.issueDate)} label="DD Mon YYYY" /> },
            { label: "VALID UNTIL", value: <Fill value={day(content.validUntil)} label="DD Mon YYYY" /> },
            { label: "CLIENT", value: <Fill value={client} label="Client / Business name" /> },
          ]}
        />

        <Section title="1. Summary">
          <Text style={s.body}>
            <Fill value={content.summary} label="What we will do every month" />
          </Text>
          <Text style={[s.body, { marginTop: 4 }]}>
            Start date: <Fill value={day(content.startDate)} label="DD Mon YYYY" />
            {"      "}Minimum term: {months}
          </Text>
        </Section>

        <View style={s.section}>
          <SimpleTable
            heading={<Text style={s.sectionTitle}>2. What you get each month</Text>}
            columns={[
              { label: "Deliverable", width: "75%" },
              { label: "Per month", width: "25%", align: "right" },
            ]}
            rows={
              deliverables.length
                ? deliverables.map((d) => [
                    <Fill key="i" value={d.item} label="Deliverable" />,
                    <Fill key="p" value={d.perMonth} label="0" />,
                  ])
                : [[<Fill key="i" value="" label="Deliverable" />, <Fill key="p" value="" label="0" />]]
            }
          />
          <Text style={s.small}>{wording("unusedNote")}</Text>
          <SubTitle>Why this approach</SubTitle>
          <Text style={s.body}>
            <Fill value={content.whyApproach} label="Why a monthly retainer fits" />
          </Text>
        </View>

        <View style={s.section}>
          <PlanTable
            heading={<Text style={s.sectionTitle}>3. Plans</Text>}
            plans={content.plans}
            priceLabel="Monthly fee"
          />
        </View>

        <Section title="4. Reporting">
          <Text style={s.body}>
            Every {content.reporting.frequency.trim() || "month"} you receive{" "}
            <Fill value={content.reporting.description} label="what the report covers" />.
          </Text>
        </Section>

        <View style={s.section}>
          <BulletList
            heading={<Text style={s.sectionTitle}>5. Not included</Text>}
            items={content.notIncluded}
            label="Not included"
          />
          <SubTitle>About results</SubTitle>
          <Text style={s.body}>{wording("aboutResults")}</Text>
        </View>

        <Section title="6. Next steps">
          <NumberedList
            items={[
              wording("nextStep1"),
              wording("nextStep2"),
              wording("nextStep3"),
              <>
                Onboarding call on <Fill value={day(content.onboardingDate)} label="DD Mon YYYY" />.
              </>,
            ]}
          />
        </Section>

        <View style={s.section}>
          {generatedRetainerTerms(content).map((term, index) =>
            index === 0 ? (
              <View key={term} wrap={false}>
                <Text style={s.sectionTitle}>7. Terms and payment</Text>
                <Bullet>{term}</Bullet>
              </View>
            ) : (
              <Bullet key={term}>{term}</Bullet>
            ),
          )}
          {content.terms
            .filter((t) => t.text.trim())
            .map((term) => (
              <Bullet key={term.id}>{term.text}</Bullet>
            ))}
          <Text style={[s.body, { marginTop: 3 }]}>
            How to pay: <Fill value={howToPay(studio)} label="UPI or bank details" />.
          </Text>
        </View>

        <SignOff title="8. Acceptance">
          <ChosenOption label="Chosen plan" plans={content.plans} />
          <Signatures clientHeading="Accepted by (Client)" signatoryName={studio.signatoryName} />
        </SignOff>

        <PageFooter studio={studio} />
      </Page>
    </Document>
  );
}
