CREATE TABLE `payment_provider_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `reservations` ADD `expected_amount_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `is_outbid` integer DEFAULT false NOT NULL;