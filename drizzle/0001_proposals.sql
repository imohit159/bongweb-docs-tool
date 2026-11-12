CREATE TABLE "proposal_counters" (
	"type" text PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "proposal_counters_type_valid" CHECK ("proposal_counters"."type" in ('quotation', 'project', 'retainer', 'change'))
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"sequence" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"client_name" text DEFAULT '' NOT NULL,
	"issue_date" date,
	"total_paise" bigint,
	"replaces_id" uuid,
	"original_proposal_id" uuid,
	"content" jsonb NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_number_unique" UNIQUE("type","sequence","version"),
	CONSTRAINT "proposals_type_valid" CHECK ("proposals"."type" in ('quotation', 'project', 'retainer', 'change')),
	CONSTRAINT "proposals_status_valid" CHECK ("proposals"."status" in ('draft', 'sent', 'accepted', 'replaced')),
	CONSTRAINT "proposals_sequence_positive" CHECK ("proposals"."sequence" > 0),
	CONSTRAINT "proposals_version_positive" CHECK ("proposals"."version" > 0),
	CONSTRAINT "proposals_total_nonnegative" CHECK ("proposals"."total_paise" is null or "proposals"."total_paise" >= 0),
	CONSTRAINT "proposals_content_object" CHECK (jsonb_typeof("proposals"."content") = 'object')
);
--> statement-breakpoint
CREATE TABLE "studio_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"content" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_settings_singleton" CHECK ("studio_settings"."id" = 1),
	CONSTRAINT "studio_settings_content_object" CHECK (jsonb_typeof("studio_settings"."content") = 'object')
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_replaces_id_proposals_id_fk" FOREIGN KEY ("replaces_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_original_proposal_id_proposals_id_fk" FOREIGN KEY ("original_proposal_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proposals_status_type_idx" ON "proposals" USING btree ("status","type");--> statement-breakpoint
CREATE INDEX "proposals_issue_date_idx" ON "proposals" USING btree ("issue_date");