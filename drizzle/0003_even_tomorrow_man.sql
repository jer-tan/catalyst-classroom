CREATE TABLE `assignment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignment_id` int,
	`user_id` int,
	`submitted_at` timestamp,
	`grade` int,
	`graded_at` timestamp,
	CONSTRAINT `assignment_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classroom_id` varchar(256),
	`name` varchar(256) NOT NULL,
	`description` varchar(512),
	`possible_marks` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`due_at` timestamp,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_classroom_id_classrooms_id_fk` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE no action ON UPDATE no action;