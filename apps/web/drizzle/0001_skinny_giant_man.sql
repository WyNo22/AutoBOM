ALTER TABLE "bom_line" ADD COLUMN "custom_values" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "bom" ADD COLUMN "custom_columns" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "column_prefs" jsonb;