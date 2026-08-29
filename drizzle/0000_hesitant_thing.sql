CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`minute_index` integer NOT NULL,
	`visitor_hash` text,
	`path` text,
	`occurred_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_minute_type_time` ON `analytics_events` (`minute_index`,`event_type`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `minute_pricing` (
	`minute_index` integer PRIMARY KEY NOT NULL,
	`amount_cents` integer,
	`pricing_type` text NOT NULL,
	`label` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ownership_minutes` (
	`ownership_id` text NOT NULL,
	`minute_index` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	PRIMARY KEY(`ownership_id`, `minute_index`),
	FOREIGN KEY (`ownership_id`) REFERENCES `ownerships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_active_ownership_per_minute` ON `ownership_minutes` (`minute_index`) WHERE "ownership_minutes"."active" = 1;--> statement-breakpoint
CREATE TABLE `ownerships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text,
	`purchased_at` text NOT NULL,
	`purchase_price_cents` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ownerships_user_id_active` ON `ownerships` (`user_id`,`active`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`reservation_id` text,
	`stripe_session_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_stripe_session_id_unique` ON `payments` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`website_url` text NOT NULL,
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`logo_key` text,
	`screenshot_key` text,
	`background_key` text,
	`accent_color` text DEFAULT '#ff5c35' NOT NULL,
	`social_handle` text,
	`disabled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_user_id` ON `products` (`user_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`minute_index` integer NOT NULL,
	`reason` text NOT NULL,
	`details` text NOT NULL,
	`reporter_email` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reservation_minutes` (
	`reservation_id` text NOT NULL,
	`minute_index` integer NOT NULL,
	PRIMARY KEY(`reservation_id`, `minute_index`),
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_reserved_minute` ON `reservation_minutes` (`minute_index`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`status` text NOT NULL,
	`expires_at` text NOT NULL,
	`stripe_session_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_stripe_session_id_unique` ON `reservations` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `idx_reservations_status_expires` ON `reservations` (`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);