"use client";

import { FieldGroup } from "@/components/ui/field";
import type { ClientDetails } from "../../../schema";
import { TextField } from "./text-field";

export function ClientFields({
  client,
  onChange,
  readOnly,
}: {
  client: ClientDetails;
  onChange: (key: keyof ClientDetails, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <FieldGroup>
      <TextField
        label="Client name"
        required
        maxLength={120}
        readOnly={readOnly}
        value={client.name}
        onChange={(v) => onChange("name", v)}
      />
      <TextField
        label="Business name"
        required
        maxLength={160}
        readOnly={readOnly}
        value={client.business}
        onChange={(v) => onChange("business", v)}
      />
      <TextField
        label="City"
        maxLength={80}
        readOnly={readOnly}
        value={client.city}
        onChange={(v) => onChange("city", v)}
      />
      <TextField
        label="Phone / WhatsApp"
        type="tel"
        maxLength={40}
        readOnly={readOnly}
        value={client.phone}
        onChange={(v) => onChange("phone", v)}
      />
      <TextField
        label="Email"
        type="email"
        maxLength={160}
        readOnly={readOnly}
        value={client.email}
        onChange={(v) => onChange("email", v)}
      />
    </FieldGroup>
  );
}
