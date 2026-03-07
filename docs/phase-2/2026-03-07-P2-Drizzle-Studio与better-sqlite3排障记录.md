# P2：Drizzle Studio 与 better-sqlite3 排障记录

## 背景

在第二阶段推进到 `api-server + SQLite + Drizzle ORM` 之后，数据库读写已经可以正常工作，但我们很快遇到了一个实际开发问题：项目虽然能跑，数据库也已经落盘，但本地无法顺利通过 Drizzle Studio 直接可视化查看 SQLite 数据。

这个问题并不影响业务接口读写，却会直接影响日常开发效率。对于第二阶段后续还要继续迁移用户、文案、简历和项目模块来说，数据库可视化检查能力非常重要，因此这次排障本身也值得完整记录下来。

## 问题现象

最开始在 `apps/api-server` 中执行以下命令：

```bash
pnpm run db:studio
```

命令直接报错，提示默认查找 `drizzle.config.json`，但当前目录并不存在这个配置文件。

随后即使补上配置，`drizzle-kit studio` 仍然无法正常启动，继续报出 `better-sqlite3` 相关 native bindings 缺失错误，无法打开数据库文件。

## 第一层问题：Drizzle 配置文件位置不正确

### 现象

在 `apps/api-server` 中执行：

```bash
pnpm run db:studio
```

Drizzle Kit 默认会尝试读取当前目录下的配置文件，也就是：

- `apps/api-server/drizzle.config.json`
- 或者显式指定的配置路径

但项目当时真实的配置文件在：

- `packages/database/drizzle.config.ts`

因此，CLI 找不到配置文件时会直接失败。

### 定位思路

这里的关键不是看业务代码，而是先看命令的执行上下文。

当前执行目录在 `apps/api-server`，所以 `drizzle-kit` 的默认行为就是从 `apps/api-server` 向下找配置。只要脚本里没有显式写 `--config`，就一定会出错。

### 解决方式

本次最终采用了两步修正。

第一步，在 `apps/api-server` 下补一份专用配置文件：

- `apps/api-server/drizzle.config.ts`

第二步，把脚本全部改成显式指向这份配置：

```json
{
  "scripts": {
    "db:push": "drizzle-kit push --config=drizzle.config.ts",
    "db:generate": "drizzle-kit generate --config=drizzle.config.ts",
    "db:migrate": "drizzle-kit migrate --config=drizzle.config.ts",
    "db:studio": "drizzle-kit studio --config=drizzle.config.ts"
  }
}
```

这样处理之后，`api-server` 就拥有了面向开发者的本地数据库工具入口，而不是继续依赖共享包目录里的脚本定义。

## 第二层问题：Schema 文件导入方式导致 Drizzle Kit 无法加载

### 现象

配置文件路径修复后，`drizzle-kit` 继续报错，提示无法找到：

- `./site-settings.js`

这个错误来自 `packages/database/src/schema/index.ts` 的导出链路。

### 定位思路

这个问题的关键在于区分两种运行方式。

- 项目业务代码运行时，TypeScript 与当前工具链可以处理 `*.js` 风格的 ESM 导入写法。
- `drizzle-kit` 在读取 schema 时，实际上是自己去加载 TypeScript 源码文件，这时对 barrel file 和运行时扩展名的处理会更敏感。

也就是说，这不是 schema 本身写错了，而是 `drizzle-kit` 对当前 schema 入口的解析方式，与项目运行时的模块解析方式并不完全一致。

### 解决方式

最终没有继续让 `drizzle-kit` 读取 `schema/index.ts` 作为入口，而是直接在配置文件中把 schema 指向具体文件：

- `packages/database/src/schema/site-settings.ts`

这样处理之后，CLI 不需要再绕过一层 barrel export，也就避免了 `./site-settings.js` 的解析问题。

## 第三层问题：`db:status` 命令并不被当前版本的 Drizzle Kit 支持

### 现象

配置中一开始增加了：

```json
"db:status": "drizzle-kit status --config=drizzle.config.ts"
```

但执行后报错：

- `Unknown command: 'status'`

### 定位思路

这里要注意一个常见误区：不同版本的 Drizzle Kit，CLI 命令集合并不完全一样。

很多教程里出现过 `status`，但当前项目实际安装的版本并不支持它，因此这里不能机械照搬命令名。

### 解决方式

本次改为使用当前版本真实可用的检查命令：

```json
"db:status": "drizzle-kit check --config=drizzle.config.ts"
```

修复后执行：

```bash
pnpm --dir apps/api-server run db:status
```

可以正常返回检查结果。

## 第四层问题：`better-sqlite3` Native Binding 丢失

### 现象

即使配置和 schema 入口都修正后，`db:studio` 仍然会报错，核心信息是：

- `Could not locate the bindings file`

这说明 `better-sqlite3` 虽然包已经安装，但它对应的本地原生模块 `.node` 文件没有成功生成。

### 为什么会发生

`better-sqlite3` 是 Native Addon，它不是纯 JavaScript 包。项目安装它时，需要在本机根据当前 Node 版本和系统环境完成原生编译，或者下载匹配的预编译产物。

如果这一步失败，就会出现以下现象：

- 包在 `node_modules` 中存在
- TypeScript 类型也能装上
- 但运行时找不到 `better_sqlite3.node`

这也是为什么项目业务当前选择了 `node:sqlite` 作为 SQLite 运行时驱动，而 Drizzle Studio 却依赖 `better-sqlite3` 时会再次暴露这个问题。

## 排障定位过程

这次排障按以下顺序推进，比较适合后续复用。

### 1. 先确认是不是脚本或配置路径问题

先看命令在什么目录执行，再看它默认会去读哪里的配置文件。这个阶段能先排除“只是命令没写对”的问题。

### 2. 再确认是不是 schema 入口问题

当配置已经正确，但 CLI 依然报模块解析错误时，就要检查 Drizzle Kit 真正读取的是哪一个 schema 文件，而不是只看业务代码是否能跑。

### 3. 最后确认是不是 SQLite 驱动本身出了问题

执行以下 smoke test：

```bash
node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); console.log(db.prepare('select 1 as x').get())"
```

如果这一步都失败，就说明问题已经不在 Drizzle 配置层，而是 `better-sqlite3` 自身没有可用的本地编译产物。

## 最终解决方案

### 1. 补齐 `apps/api-server` 本地 Drizzle 配置

新增：

- `apps/api-server/drizzle.config.ts`

它会显式指向：

- schema：`packages/database/src/schema/site-settings.ts`
- migration：`packages/database/drizzle`
- sqlite 文件：`data/platform.sqlite`

### 2. 修正 `api-server` 的数据库脚本

脚本全部改为显式带 `--config=drizzle.config.ts`。

同时将原本不可用的：

- `db:status`

调整为：

- `drizzle-kit check --config=drizzle.config.ts`

### 3. 手动编译 `better-sqlite3`

在当前仓库中执行：

```bash
cd node_modules/better-sqlite3
npm run build-release
```

这一步成功后，`better-sqlite3` 的 native binding 会被真正构建出来。

之后再执行：

```bash
pnpm --dir apps/api-server run db:studio
```

Drizzle Studio 就可以正常启动。

## 最终结果

修复完成后，当前已经可以正常执行：

```bash
pnpm --dir apps/api-server run db:status
pnpm --dir apps/api-server run db:studio
```

其中 `db:studio` 启动后，会输出本地可访问地址，例如：

- `https://local.drizzle.studio`

这意味着当前项目已经具备：

- 正式业务读写链路
- 数据库迁移能力
- 本地数据库可视化查看能力

## 这次问题带来的经验

这次问题很典型，它提醒我们不要把“依赖安装成功”和“本地开发链路已经可用”混为一谈。

在数据库工具链里，真正需要分别确认的是：

- 配置文件是否在正确上下文中可见
- CLI 是否支持当前脚本里的命令
- schema 入口是否适合被工具直接加载
- Native 依赖是否真的完成了本地构建

只有四层都确认过，数据库开发体验才会稳定。

## 建议保留的排障顺序

如果后续新人再遇到类似问题，建议始终按下面的顺序排查：

1. 先看命令执行目录和配置文件路径
2. 再看 Drizzle Kit 当前版本是否支持所写命令
3. 再看 schema 入口是否适合 CLI 读取
4. 最后再检查 `better-sqlite3` 是否可以单独运行

这个顺序能大幅减少无效排查时间，也能避免一上来就误以为是 ORM 或业务代码本身出了问题。
