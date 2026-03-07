CREATE TABLE IF NOT EXISTS `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `status` text NOT NULL,
  `sort_order` integer NOT NULL,
  `cover` text NOT NULL,
  `external_url` text NOT NULL,
  `tags` text NOT NULL,
  `locales` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `projects_slug_unique` ON `projects` (`slug`);
