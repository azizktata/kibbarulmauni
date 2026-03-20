CREATE TABLE `note_folder` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`parentId` text,
	`name` text NOT NULL,
	`sortOrder` integer NOT NULL,
	`createdAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`folderId` text,
	`lessonKey` text,
	`noteType` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`isPinned` integer NOT NULL,
	`sortOrder` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recently_visited` (
	`userId` text NOT NULL,
	`lessonKey` text NOT NULL,
	`visitedAt` integer NOT NULL,
	PRIMARY KEY(`userId`, `lessonKey`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`age` integer,
	`createdAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `watched_lesson` (
	`userId` text NOT NULL,
	`lessonKey` text NOT NULL,
	`watchedAt` integer,
	PRIMARY KEY(`userId`, `lessonKey`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
