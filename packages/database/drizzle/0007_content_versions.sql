CREATE TABLE `content_versions` (
  `id` text PRIMARY KEY NOT NULL,
  `module_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `version` integer NOT NULL,
  `status` text NOT NULL,
  `change_type` text NOT NULL,
  `snapshot` text NOT NULL,
  `created_by` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_versions_entity_version_unique` ON `content_versions` (`module_type`,`entity_id`,`version`);
