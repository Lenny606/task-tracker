PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_day_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`ai_summary` text,
	`timer_total_seconds` integer DEFAULT 0 NOT NULL,
	`timer_is_running` integer DEFAULT false NOT NULL,
	`timer_start_time` integer,
	`updated_at` integer DEFAULT '"2026-07-06T20:51:08.744Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_day_metrics`("id", "date", "ai_summary", "timer_total_seconds", "timer_is_running", "timer_start_time", "updated_at") SELECT "id", "date", "ai_summary", "timer_total_seconds", "timer_is_running", "timer_start_time", "updated_at" FROM `day_metrics`;--> statement-breakpoint
DROP TABLE `day_metrics`;--> statement-breakpoint
ALTER TABLE `__new_day_metrics` RENAME TO `day_metrics`;--> statement-breakpoint
CREATE UNIQUE INDEX `day_metrics_date_unique` ON `day_metrics` (`date`);--> statement-breakpoint
CREATE TABLE `__new_history_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`day_metric_id` integer,
	`tracker_project_id` text,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`jira_key` text,
	`jira_summary` text,
	`total_seconds` integer DEFAULT 0 NOT NULL,
	`is_running` integer DEFAULT false NOT NULL,
	`is_marked` integer DEFAULT false NOT NULL,
	`is_ai_suggested` integer DEFAULT false NOT NULL,
	`start_time` integer,
	`created_at` integer DEFAULT '"2026-07-06T20:51:08.743Z"' NOT NULL,
	FOREIGN KEY (`day_metric_id`) REFERENCES `day_metrics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tracker_project_id`) REFERENCES `tracker_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_history_tasks`("id", "day_metric_id", "tracker_project_id", "date", "name", "jira_key", "jira_summary", "total_seconds", "is_running", "is_marked", "is_ai_suggested", "start_time", "created_at") SELECT "id", "day_metric_id", "tracker_project_id", "date", "name", "jira_key", "jira_summary", "total_seconds", "is_running", "is_marked", false, "start_time", "created_at" FROM `history_tasks`;--> statement-breakpoint
DROP TABLE `history_tasks`;--> statement-breakpoint
ALTER TABLE `__new_history_tasks` RENAME TO `history_tasks`;--> statement-breakpoint
CREATE INDEX `idx_history_tasks_date` ON `history_tasks` (`date`);--> statement-breakpoint
CREATE TABLE `__new_tracker_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`time_budget_seconds` integer DEFAULT 0 NOT NULL,
	`color` text,
	`created_at` integer DEFAULT '"2026-07-06T20:51:08.733Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-07-06T20:51:08.733Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tracker_projects`("id", "name", "description", "time_budget_seconds", "color", "created_at", "updated_at") SELECT "id", "name", "description", "time_budget_seconds", "color", "created_at", "updated_at" FROM `tracker_projects`;--> statement-breakpoint
DROP TABLE `tracker_projects`;--> statement-breakpoint
ALTER TABLE `__new_tracker_projects` RENAME TO `tracker_projects`;--> statement-breakpoint
CREATE TABLE `__new_worklogs` (
	`id` text PRIMARY KEY NOT NULL,
	`tracker_project_id` text,
	`jira_issue_key` text NOT NULL,
	`summary` text NOT NULL,
	`time_spent_seconds` integer NOT NULL,
	`started_at` integer NOT NULL,
	`comment` text,
	`synced_to_jira` integer DEFAULT false NOT NULL,
	`jira_worklog_id` text,
	`created_at` integer DEFAULT '"2026-07-06T20:51:08.742Z"' NOT NULL,
	FOREIGN KEY (`tracker_project_id`) REFERENCES `tracker_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_worklogs`("id", "tracker_project_id", "jira_issue_key", "summary", "time_spent_seconds", "started_at", "comment", "synced_to_jira", "jira_worklog_id", "created_at") SELECT "id", "tracker_project_id", "jira_issue_key", "summary", "time_spent_seconds", "started_at", "comment", "synced_to_jira", "jira_worklog_id", "created_at" FROM `worklogs`;--> statement-breakpoint
DROP TABLE `worklogs`;--> statement-breakpoint
ALTER TABLE `__new_worklogs` RENAME TO `worklogs`;--> statement-breakpoint
ALTER TABLE `settings` ADD `ai_provider` text DEFAULT 'gemini' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `gemini_api_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `openai_api_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=ON;