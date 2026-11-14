CREATE TABLE "agreement_counter" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "agreement_counter_singleton" CHECK ("agreement_counter"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"sequence" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"proposal_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"client_name" text DEFAULT '' NOT NULL,
	"issue_date" date,
	"total_paise" bigint NOT NULL,
	"content" jsonb NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agreements_number_unique" UNIQUE("sequence"),
	CONSTRAINT "agreements_type_valid" CHECK ("agreements"."type" in ('project', 'retainer')),
	CONSTRAINT "agreements_status_valid" CHECK ("agreements"."status" in ('draft', 'sent', 'signed')),
	CONSTRAINT "agreements_sequence_positive" CHECK ("agreements"."sequence" > 0),
	CONSTRAINT "agreements_row_version_positive" CHECK ("agreements"."row_version" > 0),
	CONSTRAINT "agreements_total_nonnegative" CHECK ("agreements"."total_paise" >= 0),
	CONSTRAINT "agreements_content_object" CHECK (jsonb_typeof("agreements"."content") = 'object')
);
--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agreements_status_type_idx" ON "agreements" USING btree ("status","type");--> statement-breakpoint
CREATE INDEX "agreements_proposal_idx" ON "agreements" USING btree ("proposal_id");