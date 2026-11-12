import { Document, Page, Text, View } from "@react-pdf/renderer";
import { STUDIO_NAME, howToPay, type StudioDetails } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import { CHANGE_WORDING, type ChangeContent, type ChangeWordingKey } from "../templates/change";
import { DocHeader, Fill, ItemsTable, KeyValueRows, PageFooter, Section, Signatures } from "./blocks";
import { pdfStyles as s } from "./theme";

const day = (value: string) => (value ? formatDocDate(value) : "");

export function ChangePdf({
  number,
  content,
  studio,
}: {
  number: string;
  content: ChangeContent;
  studio: StudioDetails;
}) {
  const wording = (key: ChangeWordingKey) => content.wording[key]?.trim() || CHANGE_WORDING[key].text;
  const client = [content.client.name, content.client.business].filter((v) => v.trim()).join(", ");
  return (
    <Document title={`Change Request ${number}`} author={STUDIO_NAME} creator={STUDIO_NAME}>
      <Page size="A4" style={s.page}>
        <DocHeader number={number} />
        <Text style={[s.title, { marginBottom: 12 }]}>Change Request</Text>
        <KeyValueRows
          rows={[
            { label: "Change request No.", value: number },
            { label: "Date", value: <Fill value={day(content.issueDate)} label="DD Mon YYYY" /> },
            { label: "Client", value: <Fill value={client} label="Client name, Business name" /> },
            { label: "Project", value: <Fill value={content.projectName} label="Project name" /> },
            {
              label: "Original proposal",
              value: (
                <>
                  <Fill value={content.original.number} label="BW-P-001" /> dated{" "}
                  <Fill value={day(content.original.date)} label="DD Mon YYYY" />
                </>
              ),
            },
          ]}
        />

        <Section title="What’s changing">
          <Text style={s.body}>
            <Fill value={content.change} label="What's changing" />
          </Text>
        </Section>

        <View style={s.section}>
          <ItemsTable heading={<Text style={s.sectionTitle}>Cost</Text>} items={content.items} />
        </View>

        <Section title="Timeline impact">
          <Text style={s.body}>
            Extra time: <Fill value={content.timeline.extraTime} label="+X days" />
            {"      "}New delivery: <Fill value={day(content.timeline.newDelivery)} label="DD Mon YYYY" />{" "}
            (was <Fill value={day(content.timeline.previousDelivery)} label="DD Mon YYYY" />)
          </Text>
        </Section>

        <Section title="Payment">
          <Text style={s.body}>{wording("payment")}</Text>
          <Text style={[s.body, { marginTop: 3 }]}>
            How to pay: <Fill value={howToPay(studio)} label="UPI or bank details" />.
          </Text>
        </Section>

        <Section title="Approval">
          <Text style={s.body}>{wording("approval")}</Text>
          <Signatures clientHeading="Approved by (Client)" signatoryName={studio.signatoryName} />
        </Section>

        <PageFooter />
      </Page>
    </Document>
  );
}
