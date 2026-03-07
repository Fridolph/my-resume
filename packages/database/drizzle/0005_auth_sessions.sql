ALTER TABLE `users` ADD `password_hash` text NOT NULL DEFAULT '';

CREATE TABLE `auth_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE UNIQUE INDEX `auth_sessions_token_hash_unique` ON `auth_sessions` (`token_hash`);
