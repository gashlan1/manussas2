CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`al_user_id` int,
	`entity_type` varchar(32) NOT NULL,
	`entity_id` int NOT NULL,
	`al_action` varchar(64) NOT NULL,
	`al_description` text,
	`previous_data` json,
	`new_data` json,
	`al_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_reference` varchar(32) NOT NULL,
	`case_title` varchar(255) NOT NULL,
	`case_title_ar` varchar(255),
	`case_client_id` int,
	`case_pc_id` int,
	`case_proposal_id` int,
	`case_type` enum('retainer','litigation','corporate','misa','advisory','other') NOT NULL DEFAULT 'other',
	`case_status` enum('intake','active','on_hold','completed','closed','archived') NOT NULL DEFAULT 'intake',
	`case_priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`case_assigned_to` int,
	`supervisor_id` int,
	`practice_area` varchar(128),
	`case_description` mediumtext,
	`start_date` timestamp,
	`case_due_date` timestamp,
	`case_closed_at` timestamp,
	`total_billed_sar` int DEFAULT 0,
	`case_metadata` json,
	`case_created_at` timestamp NOT NULL DEFAULT (now()),
	`case_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `cases_case_reference_unique` UNIQUE(`case_reference`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_reference` varchar(32) NOT NULL,
	`client_name_en` varchar(255) NOT NULL,
	`client_name_ar` varchar(255),
	`client_email` varchar(320),
	`client_phone` varchar(32),
	`client_company` varchar(255),
	`client_industry` varchar(128),
	`client_nationality` varchar(64),
	`is_vip` boolean DEFAULT false,
	`client_status` enum('active','inactive','prospect') NOT NULL DEFAULT 'active',
	`converted_from_pc_id` int,
	`client_notes` mediumtext,
	`client_metadata` json,
	`client_created_at` timestamp NOT NULL DEFAULT (now()),
	`client_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_client_reference_unique` UNIQUE(`client_reference`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name_en` varchar(255) NOT NULL,
	`name_ar` varchar(255),
	`company_type` varchar(64) NOT NULL,
	`logo_url` text,
	`primary_color` varchar(16),
	`enabled_modules` json,
	`settings` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `company_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`user_id` int NOT NULL,
	`firm_role` varchar(64) NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_workflow_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wf_role` varchar(64) NOT NULL,
	`time_slot` varchar(8) NOT NULL,
	`task_description` text NOT NULL,
	`task_description_ar` text,
	`is_required` boolean DEFAULT true,
	`wf_sort_order` int DEFAULT 0,
	`wf_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_workflow_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_widgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`widget_code` varchar(64) NOT NULL,
	`widget_title_en` varchar(255) NOT NULL,
	`widget_title_ar` varchar(255) NOT NULL,
	`widget_type` varchar(16) NOT NULL,
	`chart_type` varchar(16),
	`data_source` varchar(128) NOT NULL,
	`refresh_interval_seconds` int DEFAULT 300,
	`default_size` varchar(16) DEFAULT 'medium',
	`visible_to_roles` json,
	`widget_config` json,
	`widget_sort_order` int DEFAULT 0,
	`widget_is_active` boolean DEFAULT true,
	`widget_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_widgets_id` PRIMARY KEY(`id`),
	CONSTRAINT `dashboard_widgets_widget_code_unique` UNIQUE(`widget_code`)
);
--> statement-breakpoint
CREATE TABLE `docusign_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ds_envelope_id` varchar(128) NOT NULL,
	`event_type` varchar(32) NOT NULL,
	`recipient_email` varchar(320),
	`recipient_name` varchar(255),
	`ip_address` varchar(45),
	`ds_description` text,
	`raw_payload` json,
	`ds_audit_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `docusign_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docusign_envelopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`envelope_id` varchar(128) NOT NULL,
	`proposal_id` int NOT NULL,
	`client_id` int NOT NULL,
	`ds_status` enum('created','sent','delivered','viewed','signed','completed','declined','voided') NOT NULL DEFAULT 'created',
	`signer1_name` varchar(255) NOT NULL,
	`signer1_email` varchar(320) NOT NULL,
	`signer1_title` varchar(128),
	`signer1_signed_at` timestamp,
	`signer2_name` varchar(255) NOT NULL,
	`signer2_email` varchar(320) NOT NULL,
	`signer2_title` varchar(128),
	`signer2_signed_at` timestamp,
	`document_url` text,
	`document_key` varchar(255),
	`sent_at` timestamp,
	`completed_at` timestamp,
	`declined_at` timestamp,
	`decline_reason` text,
	`voided_at` timestamp,
	`void_reason` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docusign_envelopes_id` PRIMARY KEY(`id`),
	CONSTRAINT `docusign_envelopes_envelope_id_unique` UNIQUE(`envelope_id`)
);
--> statement-breakpoint
CREATE TABLE `fee_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference_number` varchar(32) NOT NULL,
	`prospective_client_id` int,
	`client_id` int,
	`category` enum('standard_retainer','framework_retainer','fixed_fee','contingency','hybrid','misa_services','litigation') NOT NULL,
	`is_dual_option` boolean DEFAULT false,
	`second_option_category` varchar(32),
	`fp_status` enum('draft','internal_review','cao_review','mp_approval','approved','sent','client_review','accepted','rejected','expired','withdrawn') NOT NULL DEFAULT 'draft',
	`title_en` varchar(255) NOT NULL,
	`title_ar` varchar(255),
	`total_value_sar` int,
	`currency` varchar(8) DEFAULT 'SAR',
	`proposal_data` json NOT NULL,
	`dual_option_data` json,
	`terms_snapshot` json,
	`created_by` int NOT NULL,
	`assigned_reviewer` int,
	`approved_by` int,
	`approved_at` timestamp,
	`sent_at` timestamp,
	`responded_at` timestamp,
	`expires_at` timestamp,
	`docusign_envelope_id` varchar(128),
	`notes` mediumtext,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fee_proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `fee_proposals_reference_number_unique` UNIQUE(`reference_number`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference_number` varchar(32) NOT NULL,
	`client_id` int NOT NULL,
	`proposal_id` int,
	`subtotal_sar` int NOT NULL,
	`vat_percent` double DEFAULT 15,
	`vat_amount` int,
	`total_sar` int NOT NULL,
	`paid_amount` int DEFAULT 0,
	`balance_due` int,
	`currency` varchar(8) DEFAULT 'SAR',
	`billing_period_start` timestamp,
	`billing_period_end` timestamp,
	`inv_status` enum('draft','sent','paid','partial','overdue','void') NOT NULL DEFAULT 'draft',
	`issued_at` timestamp,
	`due_date` timestamp,
	`paid_at` timestamp,
	`line_items` json,
	`notes` mediumtext,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_reference_number_unique` UNIQUE(`reference_number`)
);
--> statement-breakpoint
CREATE TABLE `misa_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` varchar(64) NOT NULL,
	`prospective_client_id` int,
	`applicant_name` varchar(255) NOT NULL,
	`applicant_email` varchar(320),
	`applicant_phone` varchar(32),
	`applicant_nationality` varchar(64),
	`misa_company_name` varchar(255),
	`service_type` enum('llc_incorporation','branch_office','representative_office','professional_license','commercial_registration','foreign_investment_license','special_economic_zone','other') NOT NULL,
	`misa_company_type_val` varchar(64),
	`capital_amount` int,
	`number_of_shareholders` int,
	`business_activity` text,
	`misa_status` enum('received','triage','complete','incomplete','in_progress','government_submission','approved','rejected','completed') NOT NULL DEFAULT 'received',
	`is_complete` boolean DEFAULT false,
	`missing_documents` json,
	`triage_notes` mediumtext,
	`triaged_by` int,
	`triaged_at` timestamp,
	`ai_briefing` mediumtext,
	`ai_briefing_generated_at` timestamp,
	`misa_proposal_id` int,
	`government_fee_schedule` json,
	`submitted_to_government_at` timestamp,
	`government_approved_at` timestamp,
	`misa_completed_at` timestamp,
	`raw_application_data` json,
	`misa_metadata` json,
	`misa_created_at` timestamp NOT NULL DEFAULT (now()),
	`misa_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `misa_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `misa_applications_application_id_unique` UNIQUE(`application_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nt_code` varchar(64) NOT NULL,
	`nt_title_en` varchar(255) NOT NULL,
	`nt_title_ar` varchar(255) NOT NULL,
	`body_template_en` mediumtext NOT NULL,
	`body_template_ar` mediumtext NOT NULL,
	`channel` enum('in_app','email','whatsapp') NOT NULL DEFAULT 'in_app',
	`nt_priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`recipient_roles` json,
	`escalation_path` json,
	`escalation_timeout_minutes` int,
	`nt_cron_expression` varchar(64),
	`is_scheduled` boolean DEFAULT false,
	`nt_is_active` boolean DEFAULT true,
	`nt_created_at` timestamp NOT NULL DEFAULT (now()),
	`nt_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_templates_nt_code_unique` UNIQUE(`nt_code`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_code` varchar(64) NOT NULL,
	`recipient_id` int NOT NULL,
	`notif_channel` enum('in_app','email','whatsapp') NOT NULL,
	`notif_priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`notif_status` enum('pending','sent','delivered','read','acknowledged','escalated','failed') NOT NULL DEFAULT 'pending',
	`notif_title_en` varchar(255) NOT NULL,
	`notif_title_ar` varchar(255),
	`notif_body_en` mediumtext NOT NULL,
	`notif_body_ar` mediumtext,
	`related_entity_type` varchar(32),
	`related_entity_id` int,
	`action_url` text,
	`notif_sent_at` timestamp,
	`delivered_at` timestamp,
	`read_at` timestamp,
	`acknowledged_at` timestamp,
	`escalated_at` timestamp,
	`escalated_to` int,
	`notif_metadata` json,
	`notif_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_id` int NOT NULL,
	`amount_sar` int NOT NULL,
	`payment_method` varchar(32),
	`payment_reference` varchar(128),
	`received_at` timestamp NOT NULL,
	`notes` text,
	`recorded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permission_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pal_role` varchar(64) NOT NULL,
	`pal_module_code` varchar(64) NOT NULL,
	`previous_level` varchar(16),
	`new_level` varchar(16),
	`changed_by` int NOT NULL,
	`pal_reason` text,
	`pal_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permission_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permission_matrix` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pm_role` varchar(64) NOT NULL,
	`module_code` varchar(64) NOT NULL,
	`access_level` enum('none','view','edit','full','admin') NOT NULL DEFAULT 'none',
	`custom_overrides` json,
	`pm_created_at` timestamp NOT NULL DEFAULT (now()),
	`pm_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permission_matrix_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prospective_client_id` int NOT NULL,
	`activity_type` varchar(32) NOT NULL,
	`from_stage` varchar(32),
	`to_stage` varchar(32),
	`description` text,
	`performed_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pipeline_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(16) NOT NULL,
	`total_inquiries` int DEFAULT 0,
	`total_qualified` int DEFAULT 0,
	`total_proposals_sent` int DEFAULT 0,
	`total_signed` int DEFAULT 0,
	`total_lost` int DEFAULT 0,
	`total_value_sar` int DEFAULT 0,
	`conversion_rate` int,
	`avg_days_to_convert` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pipeline_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposal_id` int NOT NULL,
	`activity_type` varchar(32) NOT NULL,
	`from_status` varchar(32),
	`to_status` varchar(32),
	`description` text,
	`performed_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposal_id` int NOT NULL,
	`is_second_option` boolean DEFAULT false,
	`description` text NOT NULL,
	`role` varchar(64),
	`rate_per_hour` int,
	`estimated_hours` int,
	`fixed_amount` int,
	`milestone_description` text,
	`government_fee` int,
	`professional_fee` int,
	`contingency_percent` double,
	`subtotal` int,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_terms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposal_id` int NOT NULL,
	`term_id` int NOT NULL,
	`pt_term_type` enum('default','optional','assumption','exclusion') NOT NULL,
	`pt_title_en` varchar(255) NOT NULL,
	`pt_title_ar` varchar(255) NOT NULL,
	`pt_body_en` mediumtext NOT NULL,
	`pt_body_ar` mediumtext NOT NULL,
	`version_at_time` int NOT NULL,
	`pt_sort_order` int DEFAULT 0,
	`pt_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_terms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospective_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference_number` varchar(32) NOT NULL,
	`is_misa` boolean NOT NULL DEFAULT false,
	`contact_name` varchar(255) NOT NULL,
	`company_name` varchar(255),
	`email` varchar(320),
	`phone` varchar(32),
	`nationality` varchar(64),
	`stage` enum('initial_contact','qualification','proposal_sent','negotiation','signed','lost') NOT NULL DEFAULT 'initial_contact',
	`source` enum('website','referral','misa_platform','walk_in','conference','whatsapp','email','other') NOT NULL DEFAULT 'other',
	`assigned_to` int,
	`assigned_cao` boolean DEFAULT false,
	`industry` varchar(128),
	`estimated_value` int,
	`service_interest` varchar(128),
	`notes` mediumtext,
	`qualification_score` int,
	`misa_application_id` varchar(64),
	`misa_service_type` varchar(64),
	`misa_company_type` varchar(64),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`converted_at` timestamp,
	`lost_at` timestamp,
	`lost_reason` text,
	CONSTRAINT `prospective_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `prospective_clients_reference_number_unique` UNIQUE(`reference_number`)
);
--> statement-breakpoint
CREATE TABLE `report_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_code` varchar(64) NOT NULL,
	`report_title_en` varchar(255) NOT NULL,
	`report_title_ar` varchar(255) NOT NULL,
	`report_description` text,
	`frequency` enum('daily','weekly','monthly','quarterly','annual','adhoc') NOT NULL,
	`report_cron` varchar(64),
	`report_recipient_roles` json,
	`data_sources` json,
	`template_config` json,
	`report_is_active` boolean DEFAULT true,
	`report_created_at` timestamp NOT NULL DEFAULT (now()),
	`report_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_definitions_report_code_unique` UNIQUE(`report_code`)
);
--> statement-breakpoint
CREATE TABLE `report_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`definition_id` int NOT NULL,
	`report_inst_status` enum('scheduled','generating','completed','failed') NOT NULL DEFAULT 'scheduled',
	`period_start` timestamp,
	`period_end` timestamp,
	`generated_data` json,
	`pdf_url` text,
	`excel_url` text,
	`generated_by` int,
	`generated_at` timestamp,
	`failure_reason` text,
	`ri_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retainer_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`proposal_id` int NOT NULL,
	`retainer_type` varchar(32) NOT NULL,
	`allotted_hours_monthly` int,
	`consumed_minutes` int DEFAULT 0,
	`billing_period_start` timestamp NOT NULL,
	`billing_period_end` timestamp NOT NULL,
	`alert_50_sent` boolean DEFAULT false,
	`alert_75_sent` boolean DEFAULT false,
	`alert_90_sent` boolean DEFAULT false,
	`alert_100_sent` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `retainer_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_code` varchar(64) NOT NULL,
	`display_name_en` varchar(128) NOT NULL,
	`display_name_ar` varchar(128) NOT NULL,
	`role_description` text,
	`hierarchy_level` int NOT NULL,
	`can_view_all_clients` boolean DEFAULT false,
	`can_view_financials` boolean DEFAULT false,
	`can_approve_fee_proposals` boolean DEFAULT false,
	`can_amend_fee_proposals` boolean DEFAULT false,
	`can_view_pipeline` boolean DEFAULT false,
	`can_manage_pipeline` boolean DEFAULT false,
	`can_view_billing` boolean DEFAULT false,
	`can_manage_billing` boolean DEFAULT false,
	`can_view_reports` boolean DEFAULT false,
	`can_generate_reports` boolean DEFAULT false,
	`can_manage_users` boolean DEFAULT false,
	`can_manage_roles` boolean DEFAULT false,
	`can_export_data` boolean DEFAULT false,
	`can_access_admin_panel` boolean DEFAULT false,
	`role_metadata` json,
	`role_created_at` timestamp NOT NULL DEFAULT (now()),
	`role_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_definitions_role_code_unique` UNIQUE(`role_code`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`task_title` varchar(255) NOT NULL,
	`task_title_ar` varchar(255),
	`task_case_id` int,
	`task_assigned_to` int,
	`task_created_by` int NOT NULL,
	`task_status` enum('pending','in_progress','blocked','completed','cancelled') NOT NULL DEFAULT 'pending',
	`task_priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`task_description` mediumtext,
	`task_due_date` timestamp,
	`task_completed_at` timestamp,
	`estimated_minutes` int,
	`actual_minutes` int,
	`task_metadata` json,
	`task_created_at` timestamp NOT NULL DEFAULT (now()),
	`task_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `terms_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`term_type` enum('default','optional','assumption','exclusion') NOT NULL,
	`code` varchar(16) NOT NULL,
	`title_en` varchar(255) NOT NULL,
	`title_ar` varchar(255) NOT NULL,
	`body_en` mediumtext NOT NULL,
	`body_ar` mediumtext NOT NULL,
	`is_active` boolean DEFAULT true,
	`is_removable` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`version` int DEFAULT 1,
	`last_edited_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `terms_library_id` PRIMARY KEY(`id`),
	CONSTRAINT `terms_library_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `terms_version_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`term_id` int NOT NULL,
	`version` int NOT NULL,
	`title_en` varchar(255) NOT NULL,
	`title_ar` varchar(255) NOT NULL,
	`body_en` mediumtext NOT NULL,
	`body_ar` mediumtext NOT NULL,
	`changed_by` int,
	`change_description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `terms_version_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timesheet_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`case_id` int,
	`task_id` int,
	`client_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`duration_minutes` int NOT NULL,
	`description` text NOT NULL,
	`role` varchar(64) NOT NULL,
	`rate_per_hour` int NOT NULL,
	`billable_amount` int NOT NULL,
	`is_billable` boolean DEFAULT true,
	`ts_status` enum('draft','submitted','approved','rejected','billed') NOT NULL DEFAULT 'draft',
	`approved_by` int,
	`approved_at` timestamp,
	`invoice_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timesheet_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `firm_role` varchar(64) DEFAULT 'associate';--> statement-breakpoint
ALTER TABLE `users` ADD `theme_preference` varchar(32) DEFAULT 'classic-normal';--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(5) DEFAULT 'ar';--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `title` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `hourly_rate` int;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true;