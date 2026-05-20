# Novel

## 技术栈

### Effect-TS v4

项目以 Effect 作为核心运行模型，使用 `Effect.gen` 组织异步流程，并通过 `Layer` 注入浏览器、数据库等运行时依赖。

- `BrowserService`：封装 Playwright / CloakBrowser 的浏览器上下文
- `DatabaseService`：封装 Drizzle ORM 的数据库访问
- `Effect.scoped`：管理页面、浏览器上下文等资源生命周期
- `Effect.all` / `Effect.forEach`：控制采集并发与顺序执行

### Drizzle ORM v1 + PostgreSQL

数据库层使用 Drizzle ORM，持久化目标为 PostgreSQL。

- `src/schema.ts` 定义 `novel`、`volume`、`chapter` 三张表
- 通过外键维护小说、分卷、章节之间的层级关系
- 章节正文使用 `jsonb` 存储，支持段落、居中段落、图片和换行等内容类型
- `drizzle.config.ts` 读取 `DATABASE_URL`，用于 Drizzle Kit 生成或同步 schema

### TypeScript-Go / tsgo

项目使用 TypeScript 原生预览工具链，并通过 `@effect/tsgo` 为 Effect 开发体验打补丁。

- ESM 项目结构：`"type": "module"`
- TypeScript 配置启用 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`
- 集成 `@effect/language-service`，对 Effect 代码中的非纯函数、环境访问等行为给出诊断提示

### Playwright Core + CloakBrowser

采集层基于 Playwright Core，并使用 CloakBrowser 创建更接近真实用户的浏览器上下文。

- 使用 Pixel 7 设备配置模拟移动端访问
- 启用 `geoip`、`humanize` 和 `humanPreset: "careful"`
- 先访问站点首页获取 Cloudflare clearance cookie
- 通过请求过滤减少图片、字体等非必要资源加载，加快页面解析
