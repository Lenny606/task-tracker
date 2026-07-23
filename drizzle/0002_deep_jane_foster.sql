ALTER TABLE `settings` ADD `worklog_rounding_minutes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `worklog_rounding_strategy` text DEFAULT 'nearest' NOT NULL;