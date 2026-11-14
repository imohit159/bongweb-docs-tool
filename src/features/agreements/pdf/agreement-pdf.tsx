import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  Bullet,
  DocHeader,
  DocumentHeading,
  Fill,
  PageFooter,
  Rupee,
  SimpleTable,
} from "@/features/documents/pdf/blocks";
import { pdfStyles as shared } from "@/features/documents/pdf/theme";
import { PROJECT_MILESTONES } from "@/features/proposals/templates/project";
import { STUDIO_NAME, EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import { formatAmount, splitByPercent } from "@/lib/money";
import { AGREEMENT_TYPE_LABELS } from "../domain";
import type { AgreementContent } from "../schema";
import { agreementClauseGroups } from "../template";

const s = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, marginTop: 10 },
  strong: { fontWeight: 600 },
  signature: { width: "48%", fontSize: 9.5, lineHeight: 1.6 },
});
const day = (v: string) => (v ? formatDocDate(v) : "");
function Body({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((part, i) =>
        part.startsWith("[") ? (
          <Text key={i} style={shared.gap}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </>
  );
}
function Clause({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Bullet>
      <Text style={s.strong}>{label}. </Text>
      {children}
    </Bullet>
  );
}
export interface AgreementPdfInput {
  number: string;
  content: AgreementContent;
}
export function AgreementPdf({ number, content: c }: AgreementPdfInput) {
  const groups = agreementClauseGroups(c);
  const footer = { ...EMPTY_STUDIO_DETAILS, email: c.provider.email };
  const group = (id: string) => {
    const g = groups.find((g) => g.id === id)!;
    return (
      <View key={id}>
        <View wrap={false}>
          <Text style={s.heading}>{g.title}</Text>
          {g.clauses[0] && (
            <Clause label={g.clauses[0].label}>
              <Body text={g.clauses[0].text} />
            </Clause>
          )}
        </View>
        {g.clauses.slice(1).map((clause) => (
          <Clause key={clause.id} label={clause.label}>
            <Body text={clause.text} />
          </Clause>
        ))}
      </View>
    );
  };
  const amounts = splitByPercent(
    c.feePaise,
    PROJECT_MILESTONES.map((m) => m.percent),
  );
  return (
    <Document title={`${AGREEMENT_TYPE_LABELS[c.type]} ${number}`} author={STUDIO_NAME}>
      <Page size="A4" style={shared.page}>
        <DocHeader number={number} />
        <DocumentHeading
          title={<Fill value={c.title} label="Project or plan name" />}
          subtitle={AGREEMENT_TYPE_LABELS[c.type]}
          info={[
            { label: "DATE", value: <Fill value={day(c.issueDate)} label="DD Mon YYYY" /> },
            { label: "ACCEPTED PROPOSAL", value: c.proposal.number },
            {
              label: "CLIENT",
              value: (
                <Fill
                  value={[c.client.name, c.client.business].filter(Boolean).join(", ")}
                  label="Client / Business name"
                />
              ),
            },
          ]}
        />
        <View wrap={false}>
          <Text style={s.heading}>1 Parties and accepted proposal</Text>
          <Clause label="Service provider">
            {STUDIO_NAME}, sole proprietorship of <Fill value={c.provider.legalName} label="Your name" />.
            Address: <Fill value={c.provider.address} label="Provider address" />. Email:{" "}
            <Fill value={c.provider.email} label="Provider email" />.
          </Clause>
        </View>
        <Clause label="Client">
          <Fill value={c.client.business || c.client.name} label="Client legal name" />. Address:{" "}
          <Fill value={c.client.address} label="Client address" />. Email:{" "}
          <Fill value={c.client.email} label="Client email" />. Authorised contact:{" "}
          <Fill value={c.client.name} label="Name" />.
        </Clause>
        <Clause label="Accepted proposal">
          {c.proposal.number}, dated <Fill value={day(c.proposal.date)} label="Proposal date" />; chosen{" "}
          {c.type === "project" ? "option" : "plan"}: {c.proposal.option}. Its scope, deliverables, exclusions
          and revisions form part of this agreement. This agreement prevails if terms conflict.
        </Clause>
        {group("work")}
        <Text style={s.heading}>3 Fees and payment</Text>
        {c.type === "project" ? (
          <>
            <Text style={[shared.body, { marginBottom: 5 }]}>
              <Text style={s.strong}>Total project fee </Text>
              <Rupee />
              {formatAmount(c.feePaise)}
            </Text>
            <SimpleTable
              columns={[
                { label: "Payment", width: "24%" },
                { label: "Due", width: "46%" },
                { label: "Share", width: "10%", align: "right" },
                { label: "Amount", width: "20%", align: "right" },
              ]}
              rows={PROJECT_MILESTONES.map((m, i) => [
                m.label,
                m.when,
                `${m.percent}%`,
                <>
                  <Rupee />
                  {formatAmount(amounts[i])}
                </>,
              ])}
            />
          </>
        ) : (
          <SimpleTable
            columns={[
              { label: "Monthly fee", width: "30%" },
              { label: "Payment due", width: "45%" },
              { label: "Billing", width: "25%" },
            ]}
            rows={[
              [
                <>
                  <Rupee />
                  {formatAmount(c.feePaise)}
                </>,
                `By day ${c.feeDueDay} of each month`,
                "In advance",
              ],
            ]}
          />
        )}
        {groups
          .find((g) => g.id === "payment")!
          .clauses.map((clause) => (
            <Clause key={clause.id} label={clause.label}>
              <Body text={clause.text} />
            </Clause>
          ))}
        <PageFooter studio={footer} />
      </Page>
      <Page size="A4" style={shared.page}>
        <DocHeader number={number} />
        {group("ownership")}
        {group("ending")}
        <View style={{ marginTop: "auto", paddingTop: 6 }}>
          {group("acceptance")}
          <View wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
            {[
              { heading: "For the Client", name: c.client.name, role: c.client.role, date: c.clientSignDate },
              {
                heading: `For ${STUDIO_NAME}`,
                name: c.provider.legalName,
                role: c.provider.role,
                date: c.providerSignDate,
              },
            ].map((sig) => (
              <View style={s.signature} key={sig.heading}>
                <Text style={[shared.body, s.strong, { marginBottom: 16 }]}>{sig.heading}</Text>
                <Text style={shared.body}>Signature ____________________</Text>
                <Text style={shared.body}>
                  Name <Fill value={sig.name} label="Signatory name" />
                </Text>
                <Text style={shared.body}>
                  Role <Fill value={sig.role} label="Designation" />
                </Text>
                <Text style={shared.body}>
                  Date <Fill value={day(sig.date)} label="DD Mon YYYY" />
                </Text>
              </View>
            ))}
          </View>
        </View>
        <PageFooter studio={footer} />
      </Page>
    </Document>
  );
}
