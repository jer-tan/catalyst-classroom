CREATE TABLE `ai_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_key` text NOT NULL,
	`response` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_materials_id` PRIMARY KEY(`id`)
);
