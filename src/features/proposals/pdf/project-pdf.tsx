import { Document, Page, Text, View } from "@react-pdf/renderer";
import { STUDIO_NAME, howToPay, type StudioDetails } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import { formatAmount } from "@/lib/money";
import {
  PROJECT_WORDING,
  projectPayment,
  type ProjectContent,
  type ProjectWordingKey,
} from "../templates/project";
import {
  BulletList,
  ChosenOption,
  DocHeader,
  Fill,
  KeyValueRows,
  InfoRow,
  TitleBlock,
  NumberedList,
  PageFooter,
  PlanTable,
  Rupee,
  Section,
  Signatures,
  SimpleTable,
  SubTitle,
} from "./blocks";
import { pdfStyles as s } from "./theme";

const day = (value: string) => (value ? formatDocDate(value) : "");

function Heading({ n, children }: { n: number; children: string }) {
  return (
    <Text style={s.sectionTitle}>
      {n}. {children}
    </Text>
  );
}

export function ProjectPdf({
  number,
  content,
  studio,
}: {
  number: string;
  content: ProjectContent;
  studio: StudioDetails;
}) {
  const wording = (key: ProjectWordingKey) => content.wording[key]?.trim() || PROJECT_WORDING[key].text;
  const { total, milestones } = projectPayment(content);
  const client = [content.client.name, content.client.business].filter((v) => v.trim()).join(", ");
  const contactLine = [content.contact.phone, content.contact.email].filter((v) => v.trim()).join(" · ");
  const services = content.solution.services;

  return (
    <Document title={`Project Proposal ${number}`} author={STUDIO_NAME} creator={STUDIO_NAME}>
      <Page size="A4" style={s.page}>
        <DocHeader number={number} />
        <TitleBlock
          title={<Fill value={content.projectName} label="Project name" />}
          subtitle={<Fill value={content.outcome} label="One line on the outcome" />}
        />
        <InfoRow
          items={[
            { label: "DATE", value: <Fill value={day(content.issueDate)} label="DD Mon YYYY" /> },
            { label: "VALID UNTIL", value: <Fill value={day(content.validUntil)} label="DD Mon YYYY" /> },
            { label: "CLIENT", value: <Fill value={client} label="Client / Business name" /> },
          ]}
        />

        <View style={s.section}>
          <View wrap={false}>
            <Heading n={1}>Summary</Heading>
            <Text style={s.body}>
              <Fill value={content.summary} label="Summary" />
            </Text>
          </View>
          <BulletList
            heading={<SubTitle>Key highlights</SubTitle>}
            items={content.highlights}
            label="Client benefit"
          />
        </View>

        <View style={s.section}>
          <BulletList
            heading={
              <>
                <Heading n={2}>Problems</Heading>
                <SubTitle>Problems we noticed</SubTitle>
              </>
            }
            items={content.problems}
            label="Problem"
          />
          <BulletList
            heading={<SubTitle>What you want to achieve</SubTitle>}
            items={content.goals}
            label="Goal"
          />
          <BulletList
            heading={<SubTitle>Key requirements</SubTitle>}
            items={content.requirements}
            label="Requirement"
          />
        </View>

        <View style={s.section}>
          <View wrap={false}>
            <Heading n={3}>Our solution</Heading>
            <Text style={[s.body, { marginBottom: 6 }]}>
              <Fill value={content.solution.approach} label="Overall approach" />
            </Text>
          </View>
          {services.map((service, index) => (
            <View key={service.id} wrap={false} style={{ marginBottom: 6 }}>
              <SubTitle>
                {index + 1}. <Fill value={service.name} label="Service name" />
              </SubTitle>
              <KeyValueRows
                rows={[
                  { label: "What you get", value: <Fill value={service.whatYouGet} label="Deliverables" /> },
                  { label: "Revision rounds", value: service.revisions || "—" },
                  { label: "We need from you", value: service.weNeed || "—" },
                  { label: "Not included", value: service.notIncluded || "—" },
                ]}
              />
            </View>
          ))}
          <SubTitle>Why this approach</SubTitle>
          <Text style={s.body}>
            <Fill value={content.solution.whyApproach} label="Why this approach" />
          </Text>
        </View>

        <View style={s.section}>
          <SimpleTable
            heading={<Heading n={4}>Timeline</Heading>}
            columns={[
              { label: "Phase", width: "24%" },
              { label: "What happens", width: "56%" },
              { label: "Duration", width: "20%" },
            ]}
            rows={content.phases.map((phase) => [
              phase.name || "—",
              <Fill key="w" value={phase.what} label="What happens" />,
              <Fill key="d" value={phase.duration} label="Week" />,
            ])}
          />
        </View>

        <View style={s.section}>
          <PlanTable
            plans={content.investment}
            priceLabel="Price"
            heading={
              <>
                <Heading n={5}>Investment</Heading>
                {content.investment.mode === "plans" && (
                  <Text style={[s.body, { marginBottom: 6 }]}>{wording("investmentIntro")}</Text>
                )}
              </>
            }
          />
          <View wrap={false}>
            <SubTitle>Payment breakdown</SubTitle>
            <SimpleTable
              columns={[
                { label: "Milestone", width: "22%" },
                { label: "When", width: "48%" },
                { label: "%", width: "10%", align: "right" },
                {
                  label: (
                    <>
                      Amount (<Rupee />)
                    </>
                  ),
                  width: "20%",
                  align: "right",
                },
              ]}
              rows={milestones.map((m) => [m.label, m.when, `${m.percent}%`, formatAmount(m.amount)])}
              total={["Total", "", "100%", formatAmount(total)]}
            />
            <Text style={s.body}>{wording("finalFilesNote")}</Text>
            <Text style={s.body}>
              How to pay: <Fill value={howToPay(studio)} label="UPI or bank details" />.
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <SimpleTable
            heading={
              <>
                <Heading n={6}>Third-party costs</Heading>
                <Text style={[s.body, { marginBottom: 6 }]}>{wording("thirdPartyIntro")}</Text>
              </>
            }
            columns={[
              { label: "Item", width: "45%" },
              { label: "Approx. cost", width: "30%" },
              { label: "Paid to", width: "25%" },
            ]}
            rows={content.thirdParty.map((row) => [
              row.item || "—",
              row.costPaise ? (
                <>
                  <Rupee />
                  {formatAmount(row.costPaise)} {row.period}
                </>
              ) : (
                "—"
              ),
              row.paidTo || "—",
            ])}
          />
        </View>

        <View style={s.section}>
          <BulletList
            heading={<Heading n={7}>Why Bongweb</Heading>}
            items={content.whyBongweb}
            label="Reason"
          />
          {content.relevantWork.trim() ? (
            <>
              <SubTitle>Relevant work</SubTitle>
              <Text style={s.body}>{content.relevantWork}</Text>
            </>
          ) : null}
        </View>

        <Section title="8. Next steps">
          <NumberedList
            items={[
              wording("nextStep1"),
              wording("nextStep2"),
              wording("nextStep3"),
              <>
                Kick-off call on <Fill value={day(content.kickoffDate)} label="DD Mon YYYY" />.
              </>,
            ]}
          />
        </Section>

        <View style={s.section}>
          <BulletList
            heading={<Heading n={9}>Terms and conditions</Heading>}
            items={content.terms}
            label="Terms"
          />
        </View>

        <Section title="10. Contact">
          <Text style={s.body}>
            Questions? <Fill value={content.contact.name} label="Your name" />
            {content.contact.role ? `, ${content.contact.role}` : ""} ·{" "}
            <Fill value={contactLine} label="Phone · Email" />
          </Text>
        </Section>

        <Section title="11. Acceptance">
          <ChosenOption label="Chosen option" plans={content.investment} />
          <Signatures clientHeading="Accepted by (Client)" signatoryName={studio.signatoryName} />
        </Section>

        <PageFooter />
      </Page>
    </Document>
  );
}
