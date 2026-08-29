DROP INDEX `uq_reserved_minute`;--> statement-breakpoint
ALTER TABLE `reservation_minutes` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_active_reserved_minute` ON `reservation_minutes` (`minute_index`) WHERE "reservation_minutes"."active" = 1;