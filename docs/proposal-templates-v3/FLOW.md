# Bongweb Sales Document Flow

How a client moves from first enquiry to payment, and which document is sent at each step.

## The Proposals family

Every offer Bongweb sends belongs to one family with four types. Each scenario gets **one** offer: a quotation or a proposal, never both.

| Type              | Use when                                          | Template                    | Number    |
| ----------------- | ------------------------------------------------- | --------------------------- | --------- |
| Quotation         | Client knows exactly what they want; small job    | `01-quick-quote.docx`       | BW-Q-001  |
| Project Proposal  | Client has a problem to solve; one-time project   | `02-project-proposal.docx`  | BW-P-001  |
| Retainer Proposal | Ongoing monthly work                              | `03-retainer-proposal.docx` | BW-R-001  |
| Change Request    | Extra work on a project that is already accepted  | `04-change-request.docx`    | BW-CR-001 |

### Choosing the type

1. Extra work on an accepted project? → **Change Request**
2. Monthly, ongoing work? → **Retainer Proposal**
3. Client knows exactly what they want, and the job is small? → **Quotation**
4. Otherwise → **Project Proposal**

## Flows

### Small job (bug fix, menu design, single landing page)

```
Enquiry → Quotation → Client replies "Approved"
→ Proforma Invoice (50% advance) → Work → Invoice (50%) → Delivery
```

No separate contract. The terms on the quotation plus the client's "Approved" are enough.

### Project (website, app, branding)

```
Enquiry → Discovery call → Project Proposal → Client accepts
→ Service Agreement → Proforma Invoice (50% advance) → Work
→ Invoice (40%, on design/beta approval) → Invoice (10%, before go-live) → Handover
```

### Monthly work (maintenance, social media, outreach)

```
Enquiry → Discovery call → Retainer Proposal → Client accepts
→ Service Agreement → Invoice every month, paid in advance
```

### Extra work during a project

```
Client asks for something outside scope → Change Request → Client approves
→ Payment in full → Work
```

## Rules

- **Talk before proposing.** A proposal needs the client's situation and goals, which come from the discovery call. To introduce Bongweb before any conversation, send a Company Profile, not a proposal.
- **One active offer per scenario.** If scope or price changes after discussion, send a revised proposal (`BW-P-001 v2`), not a quotation. Two documents with two prices invite haggling.
- **Quote grows into a project.** Mark the quotation as replaced and send a Project Proposal.
- **Build plus monthly care** is two scenarios: a Project Proposal for the build and a Retainer Proposal for the care.
- **Work starts only after the advance is received.** Final files, logins and go-live are handed over only after the final payment.

## Payment terms

| Offer type        | Terms                                                         |
| ----------------- | ------------------------------------------------------------- |
| Quotation         | 50% advance, 50% on delivery                                  |
| Project Proposal  | 50% advance, 40% on design/beta approval, 10% before go-live  |
| Retainer Proposal | Monthly in advance; minimum term; 30 days' notice to stop     |
| Change Request    | 100% before the change work starts                            |

Bongweb is not registered under GST, so no document charges GST or shows a GSTIN.

## Document status

| Document          | Status    |
| ----------------- | --------- |
| Quotation         | Ready     |
| Project Proposal  | Ready     |
| Retainer Proposal | Ready     |
| Change Request    | Ready     |
| Service Agreement | Not built |
| Proforma Invoice  | Not built |
| Invoice           | Not built |
| Company Profile   | Later     |

**Until the agreement and invoices exist,** take the advance against the accepted proposal using the bank and UPI details printed in each template.
