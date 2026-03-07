CREATE TABLE IF NOT EXISTS `resume_documents` (
  `id` text PRIMARY KEY NOT NULL,
  `status` text NOT NULL,
  `locales` text NOT NULL,
  `updated_at` text NOT NULL
);
