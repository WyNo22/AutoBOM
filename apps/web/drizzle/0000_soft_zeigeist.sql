CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`bom_line_id` text NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`size_bytes` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bom_line_id`) REFERENCES `bom_line`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attachment_line_idx` ON `attachment` (`bom_line_id`);--> statement-breakpoint
CREATE TABLE `bom_line` (
	`id` text PRIMARY KEY NOT NULL,
	`bom_id` text NOT NULL,
	`position` integer NOT NULL,
	`designation` text NOT NULL,
	`qty` real DEFAULT 1 NOT NULL,
	`material` text,
	`supplier_id` text,
	`supplier_ref` text,
	`product_url` text,
	`unit_price_ht` real,
	`tva` real,
	`lead_time_days` integer,
	`notes` text,
	`status` text DEFAULT 'to_source' NOT NULL,
	FOREIGN KEY (`bom_id`) REFERENCES `bom`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `bom_line_bom_idx` ON `bom_line` (`bom_id`);--> statement-breakpoint
CREATE TABLE `bom_version` (
	`id` text PRIMARY KEY NOT NULL,
	`bom_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_by_id` text NOT NULL,
	FOREIGN KEY (`bom_id`) REFERENCES `bom`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bom` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`current_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bom_project_idx` ON `bom` (`project_id`);--> statement-breakpoint
CREATE TABLE `cart_batch_line` (
	`cart_batch_id` text NOT NULL,
	`bom_line_id` text NOT NULL,
	`qty` real DEFAULT 1 NOT NULL,
	PRIMARY KEY(`cart_batch_id`, `bom_line_id`),
	FOREIGN KEY (`cart_batch_id`) REFERENCES `cart_batch`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bom_line_id`) REFERENCES `bom_line`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cart_batch` (
	`id` text PRIMARY KEY NOT NULL,
	`bom_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_ht` real DEFAULT 0 NOT NULL,
	`total_ttc` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bom_id`) REFERENCES `bom`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_member` (
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'designer' NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`default_shipping_ht` real,
	`known_site` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `validation` (
	`id` text PRIMARY KEY NOT NULL,
	`bom_id` text NOT NULL,
	`validator_id` text NOT NULL,
	`decision` text DEFAULT 'pending' NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`decided_at` integer,
	FOREIGN KEY (`bom_id`) REFERENCES `bom`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`validator_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
