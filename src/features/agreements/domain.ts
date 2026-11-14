export const AGREEMENT_TYPES = ["project", "retainer"] as const;
export type AgreementType = (typeof AGREEMENT_TYPES)[number];
export const AGREEMENT_STATUSES = ["draft", "sent", "signed"] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];
export const AGREEMENT_TYPE_LABELS: Record<AgreementType, string> = {
  project: "Project Service Agreement",
  retainer: "Retainer Service Agreement",
};
export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  signed: "Signed",
};
export const AGREEMENT_TRANSITIONS: Record<AgreementStatus, readonly AgreementStatus[]> = {
  draft: ["sent"],
  sent: ["draft", "signed"],
  signed: [],
};
export function formatAgreementNumber(sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1) throw new RangeError("Invalid sequence");
  return `BW-SA-${String(sequence).padStart(3, "0")}`;
}
export interface AgreementSummary {
  id: string;
  type: AgreementType;
  sequence: number;
  status: AgreementStatus;
  title: string;
  clientName: string;
  issueDate: string | null;
  totalPaise: number;
}
