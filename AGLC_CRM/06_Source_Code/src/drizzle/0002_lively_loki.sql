CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aic_user_id` int NOT NULL,
	`aic_title` varchar(255),
	`aic_context` varchar(64) DEFAULT 'general',
	`aic_created_at` timestamp NOT NULL DEFAULT (now()),
	`aic_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aim_conversation_id` int NOT NULL,
	`aim_role` varchar(16) NOT NULL,
	`aim_content` mediumtext NOT NULL,
	`aim_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_messages_id` PRIMARY KEY(`id`)
);
