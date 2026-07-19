DROP INDEX "day_metrics_date_unique";--> statement-breakpoint
DROP INDEX "idx_history_tasks_date";--> statement-breakpoint
ALTER TABLE `day_metrics` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2026-07-19T21:19:49.779Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `day_metrics_date_unique` ON `day_metrics` (`date`);--> statement-breakpoint
CREATE INDEX `idx_history_tasks_date` ON `history_tasks` (`date`);--> statement-breakpoint
ALTER TABLE `history_tasks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:19:49.778Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:19:49.774Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2026-07-19T21:19:49.774Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `worklogs` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:19:49.777Z"';