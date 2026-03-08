ALTER TABLE `translations` ADD `updated_by` text;
ALTER TABLE `translations` ADD `reviewed_by` text;
ALTER TABLE `translations` ADD `published_at` text;

ALTER TABLE `resume_documents` ADD `updated_by` text;
ALTER TABLE `resume_documents` ADD `reviewed_by` text;
ALTER TABLE `resume_documents` ADD `published_at` text;

ALTER TABLE `projects` ADD `updated_by` text;
ALTER TABLE `projects` ADD `reviewed_by` text;
ALTER TABLE `projects` ADD `published_at` text;
