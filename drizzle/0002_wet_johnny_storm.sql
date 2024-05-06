ALTER TABLE `classroom_roles` MODIFY COLUMN `classroom_id` varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE `classroom_roles` MODIFY COLUMN `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `classroom_invites` ADD PRIMARY KEY(`code`);--> statement-breakpoint
ALTER TABLE `classroom_roles` ADD PRIMARY KEY(`classroom_id`,`user_id`);