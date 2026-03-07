# SQLite 与 Drizzle ORM 新手入门指南

## 这篇文章适合谁

这篇文章适合刚开始接触 `SQLite + Drizzle ORM` 的前端开发者、全栈开发者，或者正在把 Monorepo 项目从 mock 数据逐步切到真实数据库的新手同学。

目标不是一口气讲完所有高级特性，而是带你完成一条最实用的入门路径：

- 安装依赖
- 配置 Drizzle
- 建立 schema
- 生成和执行迁移
- 进行基本 CRUD
- 查看数据库内容

只要把这条路径走通，你就已经具备继续扩展业务模块的基础能力。

## 为什么很多项目会从 SQLite 开始

SQLite 是一个非常适合起步阶段的数据库。

它的优点很明显：

- 不需要单独启动数据库服务
- 一个文件就能承载完整数据
- 本地开发成本很低
- 很适合原型、管理后台和中小型内容系统的起步阶段

对于 Monorepo 项目来说，它还有一个很实用的优势：前后端团队都可以直接围绕同一份本地数据库文件做联调。

## Drizzle ORM 是什么

Drizzle ORM 是一个偏 TypeScript 风格、强调类型清晰和 SQL 边界明确的 ORM 工具。

它适合初学者的原因主要有三点：

- schema 写法比较直观
- 查询结果类型清晰
- migration 能和 schema 一起管理

你可以把它理解成“更贴近 SQL、但又能保留 TypeScript 类型体验”的 ORM。

## 一、先准备依赖

### 1. 运行时依赖

如果你要在 Node 环境里使用 Drizzle 和 SQLite，常见依赖通常包括：

```bash
pnpm add drizzle-orm better-sqlite3
```

如果你的项目暂时不想被 `better-sqlite3` 的 native 编译问题卡住，也可以在业务运行时先使用 `node:sqlite`，但 Drizzle Studio 这类工具通常还是会依赖 `better-sqlite3`。

### 2. 开发工具依赖

```bash
pnpm add -D drizzle-kit @types/better-sqlite3
```

这些工具主要用于：

- 生成迁移
- 执行迁移
- 校验配置
- 打开 Drizzle Studio

## 二、建立 Drizzle 配置

一个最基础的 Drizzle 配置大致如下：

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/site-settings.ts',
  out: './drizzle',
  dbCredentials: {
    url: './data/platform.sqlite'
  }
})
```

这个配置至少要明确三件事：

- schema 文件在哪里
- migration 输出目录在哪里
- SQLite 文件在哪里

如果你是在 Monorepo 中使用 Drizzle，建议像当前项目一样，把路径写成明确的绝对路径或基于 workspace root 解析后的路径，这样更稳定。

## 三、建立第一份 schema

下面是一个非常适合入门的 schema 示例：

```ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const siteSettings = sqliteTable('site_settings', {
  id: text('id').primaryKey(),
  defaultLocale: text('default_locale').notNull(),
  socialLinks: text('social_links').notNull(),
  downloadLinks: text('download_links').notNull(),
  seo: text('seo').notNull(),
  updatedAt: text('updated_at').notNull()
})
```

这个 schema 表达的是：

- 表名叫 `site_settings`
- 主键是 `id`
- 默认语言、社交链接、下载链接、SEO 配置和更新时间都需要保存

对于初学者来说，如果表里包含复杂对象或数组，最简单的方法是先以 JSON 字符串形式保存到 `text` 字段中，再通过仓储层手动做序列化和反序列化。

## 四、生成迁移

配置和 schema 准备好后，可以执行：

```bash
pnpm run db:generate
```

这一步的作用是：

- 根据当前 schema 生成 SQL 迁移文件
- 生成迁移元数据

执行后，通常会得到类似结构：

```txt
drizzle/
  0000_init_platform.sql
  meta/
    _journal.json
```

## 五、执行迁移

生成迁移后，需要真正把数据库表创建出来。

如果你的脚本配置好了，可以直接执行：

```bash
pnpm run db:migrate
```

执行成功后，SQLite 文件中通常会出现：

- 业务表，例如 `site_settings`
- Drizzle 自己维护的迁移记录表，例如 `__drizzle_migrations`

这是判断数据库初始化是否成功的第一步。

## 六、如何做基本 CRUD

下面用“站点设置”举一个入门示例。

### 1. Create / Seed

第一次插入默认数据时，可以写一个 `ensureSeed` 函数：

```ts
await db.insert(siteSettings).values({
  id: 'site_settings_main',
  defaultLocale: 'zh-CN',
  socialLinks: JSON.stringify([]),
  downloadLinks: JSON.stringify([]),
  seo: JSON.stringify({
    title: 'My Site',
    description: 'Site description',
    ogImage: 'https://example.com/og.png',
    siteUrl: 'https://example.com'
  }),
  updatedAt: new Date().toISOString()
})
```

### 2. Read

```ts
const [record] = await db.select()
  .from(siteSettings)
  .where(eq(siteSettings.id, 'site_settings_main'))
  .limit(1)
```

### 3. Update

```ts
await db.insert(siteSettings)
  .values(nextRow)
  .onConflictDoUpdate({
    target: siteSettings.id,
    set: {
      defaultLocale: nextRow.defaultLocale,
      socialLinks: nextRow.socialLinks,
      downloadLinks: nextRow.downloadLinks,
      seo: nextRow.seo,
      updatedAt: nextRow.updatedAt
    }
  })
```

这个模式非常适合“单例配置表”这类数据。

### 4. Delete

```ts
await db.delete(siteSettings)
  .where(eq(siteSettings.id, 'site_settings_main'))
```

初学时建议先把 Create、Read、Update 跑通，再考虑 Delete 和批量操作。

## 七、如何查看数据库

数据库开发里，真正让你效率提升的往往不是写 ORM 本身，而是“你能不能快速看到数据库里现在到底有什么”。

### 1. 用 Drizzle Studio 查看

如果本地 `better-sqlite3` 已经可用，可以直接运行：

```bash
pnpm run db:studio
```

启动成功后，通常会输出一个本地可访问地址，例如：

- `https://local.drizzle.studio`

你可以直接在浏览器里查看表结构和数据。

### 2. 用桌面工具查看

如果你不想依赖 Node 原生模块，也可以直接用桌面工具打开 SQLite 文件：

- DB Browser for SQLite
- TablePlus
- DBeaver

只要打开数据库文件即可，例如：

- `data/platform.sqlite`

### 3. 用 Node 命令行快速查看

如果你只是想临时确认某张表的数据，也可以直接执行：

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/platform.sqlite'); console.log(db.prepare('SELECT * FROM site_settings').all())"
```

这个方式虽然没有可视化界面，但非常适合快速排障。

## 八、初学者最容易踩的坑

### 1. 配置文件放对了，但脚本没显式指定

在 Monorepo 中，命令执行目录不同，Drizzle Kit 查找配置文件的位置也会不同。最稳妥的方式是始终显式写：

```bash
drizzle-kit studio --config=drizzle.config.ts
```

### 2. Schema 可以被业务代码加载，但 Drizzle Kit 读不了

这通常和 TypeScript barrel export、ESM 扩展名或者 CLI 的模块解析方式有关。最简单的做法是先让 Drizzle Kit 直接读取具体 schema 文件。

### 3. `better-sqlite3` 已安装，但不能运行

这通常说明 native binding 没有成功编译。表现是：

- 包存在于 `node_modules`
- 但运行时报 `Could not locate the bindings file`

这时要先修 native 编译，再考虑 Drizzle Studio。

### 4. 迁移执行成功，但查询读不到想要的数据

先不要怀疑 ORM，优先确认以下几点：

- 查的数据库文件是不是同一个
- 表名是不是一致
- 字段名是不是一致
- JSON 字段是不是按字符串写入、按字符串读取

## 九、推荐给新人的学习顺序

如果你刚开始接触 `SQLite + Drizzle ORM`，建议按下面顺序学习：

1. 先理解 SQLite 文件数据库的概念
2. 再学 Drizzle schema 的写法
3. 再学 migration 的生成与执行
4. 再做一张最简单的配置表 CRUD
5. 最后再把它接进真实 API Server

不要一开始就同时学：

- ORM
- NestJS
- 权限系统
- 多表关系
- 事务
- 部署

这样学习成本会非常高。先把单表 CRUD 和数据库查看跑通，后面扩展会轻松很多。

## 十、当前项目里可以直接参考的落地位置

如果你要在当前仓库里继续学习，可以直接看这些文件：

- Drizzle 配置：`apps/api-server/drizzle.config.ts`
- 数据库共享包：`packages/database/package.json`
- schema：`packages/database/src/schema/site-settings.ts`
- 迁移文件：`packages/database/drizzle/0000_init_platform.sql`
- API 模块：`apps/api-server/src/modules/site-settings/site-settings.controller.ts`
- SDK 客户端：`packages/sdk/src/site-settings.ts`

这些文件一起构成了当前仓库里最完整、最适合初学者理解的一条真实数据库链路。

## 结语

对新手来说，`SQLite + Drizzle ORM` 是一个非常合适的起点。它既不会像纯 SQL 一样让人一下子失去类型保护，也不会像过度封装的 ORM 一样把很多底层行为藏得过深。

你真正需要做的，不是一次学会所有高级技巧，而是先把一条最短路径跑通：

- 建表
- 迁移
- 查询
- 更新
- 查看数据库

只要这五步已经能独立完成，后续不管是接 NestJS、接管理后台，还是扩展更多内容模块，你都会轻松很多。
