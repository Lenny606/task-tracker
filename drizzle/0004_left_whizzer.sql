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