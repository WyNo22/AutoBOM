CREATE TABLE `account_token` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_token_user_idx` ON `account_token` (`user_id`);--> statement-breakpoint
CREATE INDEX `account_token_type_idx` ON `account_token` (`type`);