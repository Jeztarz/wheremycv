CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company` text NOT NULL,
	`position` text NOT NULL,
	`applied_on` text NOT NULL,
	`channel` text,
	`job_url` text,
	`salary_expected` text,
	`salary_offered` text,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`note` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`last_activity_on` text NOT NULL,
	`snoozed_until` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `applications_user_idx` ON `applications` (`user_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`occurred_on` text NOT NULL,
	`at_time` text,
	`round` integer,
	`mode` text,
	`location` text,
	`note` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_application_idx` ON `events` (`application_id`);--> statement-breakpoint
CREATE INDEX `events_user_date_idx` ON `events` (`user_id`,`occurred_on`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`picture_url` text,
	`follow_days` integer DEFAULT 14 NOT NULL,
	`ghost_days` integer DEFAULT 30 NOT NULL,
	`soon_days` integer DEFAULT 1 NOT NULL,
	`line_notify` integer DEFAULT true NOT NULL,
	`notify_hour` integer DEFAULT 8 NOT NULL,
	`last_notified_on` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
