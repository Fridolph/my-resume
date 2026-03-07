CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` text PRIMARY KEY NOT NULL,
  `default_locale` text NOT NULL,
  `social_links` text NOT NULL,
  `download_links` text NOT NULL,
  `seo` text NOT NULL,
  `updated_at` text NOT NULL
);
