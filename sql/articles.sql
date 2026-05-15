-- 文章表（与 TypeORM Article 实体一致；生产请用迁移管理变更）
CREATE TABLE IF NOT EXISTS `articles` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `excerpt` TEXT NOT NULL,
  `publishedAt` DATE NOT NULL,
  `category` VARCHAR(200) NOT NULL,
  `tags` JSON NOT NULL,
  `views` INT NOT NULL DEFAULT 0,
  `likes` INT NOT NULL DEFAULT 0,
  `comments` INT NOT NULL DEFAULT 0,
  `author` VARCHAR(200) NOT NULL,
  `coverImage` TEXT NOT NULL,
  `contentMarkdown` LONGTEXT NOT NULL,
  `contentHtml` LONGTEXT NULL,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_articles_publishedAt` (`publishedAt`),
  KEY `idx_articles_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
