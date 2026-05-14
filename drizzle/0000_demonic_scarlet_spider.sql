CREATE TABLE `day_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`ai_summary` text,
	`timer_total_seconds` integer DEFAULT 0 NOT NULL,
	`timer_is_running` integer DEFAULT false NOT NULL,
	`timer_start_time` integer,
	`updated_at` integer DEFAULT '"2026-05-14T09:23:11.393Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_metrics_date_unique` ON `day_metrics` (`date`);--> statement-breakpoint
CREATE TABLE `history_tasks` (
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
	`start_time` integer,
	`created_at` integer DEFAULT '"2026-05-14T09:23:11.393Z"' NOT NULL,
	FOREIGN KEY (`day_metric_id`) REFERENCES `day_metrics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`last_synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`ai_model` text DEFAULT 'gemini-2.5-flash' NOT NULL,
	`jira_api_key` text DEFAULT '' NOT NULL,
	`jira_email` text DEFAULT '' NOT NULL,
	`jira_tempo_api_key` text DEFAULT '' NOT NULL,
	`jira_url` text DEFAULT '' NOT NULL,
	`updated_at` integer DEFAULT '"1970-01-01T00:00:00.000Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tracker_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`time_budget_seconds` integer DEFAULT 0 NOT NULL,
	`color` text,
	`created_at` integer DEFAULT '"2026-05-14T09:23:11.391Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-05-14T09:23:11.391Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `worklogs` (
	`id` text PRIMARY KEY NOT NULL,
	`tracker_project_id` text,
	`jira_issue_key` text NOT NULL,
	`summary` text NOT NULL,
	`time_spent_seconds` integer NOT NULL,
	`started_at` integer NOT NULL,
	`comment` text,
	`synced_to_jira` integer DEFAULT false NOT NULL,
	`jira_worklog_id` text,
	`created_at` integer DEFAULT '"2026-05-14T09:23:11.392Z"' NOT NULL
);
