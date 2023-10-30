CREATE TABLE `thread` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`channel_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `thread_channel_id_unique` ON `thread` (`channel_id`);