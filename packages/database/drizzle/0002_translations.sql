CREATE TABLE IF NOT EXISTS `translations` (
  `id` text PRIMARY KEY NOT NULL,
  `namespace` text NOT NULL,
  `key` text NOT NULL,
  `locale` text NOT NULL,
  `value` text NOT NULL,
  `status` text NOT NULL,
  `missing` integer NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `translations_namespace_key_locale_unique`
  ON `translations` (`namespace`, `key`, `locale`);
