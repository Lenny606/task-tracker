DROP INDEX "day_metrics_date_unique";--> statement-breakpoint
DROP INDEX "idx_history_tasks_date";--> statement-breakpoint
ALTER TABLE `day_metrics` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2026-07-19T21:06:34.563Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `day_metrics_date_unique` ON `day_metrics` (`date`);--> statement-breakpoint
CREATE INDEX `idx_history_tasks_date` ON `history_tasks` (`date`);--> statement-breakpoint
ALTER TABLE `history_tasks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:06:34.563Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:06:34.561Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2026-07-19T21:06:34.561Z"';--> statement-breakpoint
ALTER TABLE `worklogs` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:06:34.562Z"';--> statement-breakpoint
ALTER TABLE `settings` ADD `worklog_rounding_minutes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `worklog_rounding_strategy` text DEFAULT 'nearest' NOT NULL;