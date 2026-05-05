CREATE TABLE "account_token" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"bom_line_id" text NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"size_bytes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom_line" (
	"id" text PRIMARY KEY NOT NULL,
	"bom_id" text NOT NULL,
	"position" integer NOT NULL,
	"designation" text NOT NULL,
	"qty" double precision DEFAULT 1 NOT NULL,
	"material" text,
	"supplier_id" text,
	"supplier_ref" text,
	"product_url" text,
	"unit_price_ht" double precision,
	"tva" double precision,
	"lead_time_days" integer,
	"notes" text,
	"status" text DEFAULT 'to_source' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom_version" (
	"id" text PRIMARY KEY NOT NULL,
	"bom_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_batch_line" (
	"cart_batch_id" text NOT NULL,
	"bom_line_id" text NOT NULL,
	"qty" double precision DEFAULT 1 NOT NULL,
	CONSTRAINT "cart_batch_line_cart_batch_id_bom_line_id_pk" PRIMARY KEY("cart_batch_id","bom_line_id")
);
--> statement-breakpoint
CREATE TABLE "cart_batch" (
	"id" text PRIMARY KEY NOT NULL,
	"bom_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_ht" double precision DEFAULT 0 NOT NULL,
	"total_ttc" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_member" (
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'designer' NOT NULL,
	CONSTRAINT "project_member_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"team_id" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"default_shipping_ht" double precision,
	"known_site" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "team_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"first_name" text,
	"last_name" text,
	"password_hash" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"ai_sourcing_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "validation" (
	"id" text PRIMARY KEY NOT NULL,
	"bom_id" text NOT NULL,
	"validator_id" text NOT NULL,
	"decision" text DEFAULT 'pending' NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account_token" ADD CONSTRAINT "account_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_bom_line_id_bom_line_id_fk" FOREIGN KEY ("bom_line_id") REFERENCES "public"."bom_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_line" ADD CONSTRAINT "bom_line_bom_id_bom_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_line" ADD CONSTRAINT "bom_line_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_version" ADD CONSTRAINT "bom_version_bom_id_bom_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_version" ADD CONSTRAINT "bom_version_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom" ADD CONSTRAINT "bom_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_batch_line" ADD CONSTRAINT "cart_batch_line_cart_batch_id_cart_batch_id_fk" FOREIGN KEY ("cart_batch_id") REFERENCES "public"."cart_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_batch_line" ADD CONSTRAINT "cart_batch_line_bom_line_id_bom_line_id_fk" FOREIGN KEY ("bom_line_id") REFERENCES "public"."bom_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_batch" ADD CONSTRAINT "cart_batch_bom_id_bom_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_batch" ADD CONSTRAINT "cart_batch_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation" ADD CONSTRAINT "validation_bom_id_bom_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation" ADD CONSTRAINT "validation_validator_id_user_id_fk" FOREIGN KEY ("validator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_token_user_idx" ON "account_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_token_type_idx" ON "account_token" USING btree ("type");--> statement-breakpoint
CREATE INDEX "attachment_line_idx" ON "attachment" USING btree ("bom_line_id");--> statement-breakpoint
CREATE INDEX "bom_line_bom_idx" ON "bom_line" USING btree ("bom_id");--> statement-breakpoint
CREATE INDEX "bom_project_idx" ON "bom" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "team_invite_team_idx" ON "team_invite" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invite_email_idx" ON "team_invite" USING btree ("email");