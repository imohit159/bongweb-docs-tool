import { z } from "zod";

export const STUDIO_NAME = "Bongweb Studio";

const text = (max: number) => z.string().trim().max(max);

export const studioDetailsSchema = z
  .object({
    address: text(200),
    phone: text(40),
    email: z.union([z.literal(""), z.email().max(160)]),
    website: text(160),
    upiId: text(80),
    accountName: text(120),
    accountNumber: text(40),
    ifsc: text(20),
    bankName: text(120),
    signatoryName: text(120),
    signatoryRole: text(80),
  })
  .strict();

export type StudioDetails = z.infer<typeof studioDetailsSchema>;

export const EMPTY_STUDIO_DETAILS: StudioDetails = {
  address: "",
  phone: "",
  email: "",
  website: "",
  upiId: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
  signatoryName: "",
  signatoryRole: "",
};

export interface MissingStudioField {
  key: keyof StudioDetails;
  label: string;
}

/** Studio details every document prints: the FROM block and how to pay. */
export function findMissingStudioFields(studio: StudioDetails): MissingStudioField[] {
  const missing: MissingStudioField[] = [];
  const need = (key: keyof StudioDetails, label: string) => {
    if (!studio[key].trim()) missing.push({ key, label });
  };
  need("address", "Address");
  need("phone", "Phone / WhatsApp");
  need("email", "Email");
  need("upiId", "UPI ID");
  need("accountName", "Account name");
  need("accountNumber", "Account number");
  need("ifsc", "IFSC");
  need("bankName", "Bank name");
  return missing;
}

/** "UPI x or bank transfer to …", omitting the parts not filled in. */
export function howToPay(studio: StudioDetails): string {
  const bank = [
    studio.accountName && `bank transfer to ${studio.accountName}`,
    studio.accountNumber && `A/c ${studio.accountNumber}`,
    studio.ifsc && `IFSC ${studio.ifsc}`,
    studio.bankName,
  ]
    .filter(Boolean)
    .join(", ");
  return [studio.upiId && `UPI ${studio.upiId}`, bank].filter(Boolean).join(" or ");
}
