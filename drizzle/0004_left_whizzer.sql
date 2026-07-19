CREATE TABLE `task_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`jira_key` text,
	`jira_summary` text,
	`tracker_project_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT '"2026-07-19T21:49:19.638Z"' NOT NULL,
	FOREIGN KEY (`tracker_project_id`) REFERENCES `tracker_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX "day_metrics_date_unique";--> statement-breakpoint
DROP INDEX "idx_history_tasks_date";--> statement-breakpoint
ALTER TABLE `day_metrics` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2026-07-19T21:49:19.638Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `day_metrics_date_unique` ON `day_metrics` (`date`);--> statement-breakpoint
CREATE INDEX `idx_history_tasks_date` ON `history_tasks` (`date`);--> statement-breakpoint
ALTER TABLE `history_tasks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:49:19.637Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:49:19.635Z"';--> statement-breakpoint
ALTER TABLE `tracker_projects` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2026-07-19T21:49:19.635Z"';--> statement-breakpoint
ALTER TABLE `worklogs` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2026-07-19T21:49:19.637Z"';