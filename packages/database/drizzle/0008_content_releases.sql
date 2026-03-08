CREATE TABLE `content_releases` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `status` text NOT NULL,
  `resume_version_id` text NOT NULL,
  `translation_version_ids` text NOT NULL,
  `project_version_ids` text NOT NULL,
  `created_by` text,
  `activated_by` text,
  `activated_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
