# TODO：迁移到 Cloudflare

上手步骤见 `docs/cloudflare-setup.md`。

目标：把官网从 Vercel 迁到 Cloudflare Workers（OpenNext 适配器），图片存储从 Vercel Blob 迁到 R2。以后完全不用 Vercel。

已核实（2026-10-05）：

- OpenNext Cloudflare 支持 Next.js 16 全部版本。
- 不支持 Node.js 运行时的中间件；Next 16 的 `proxy.ts` 固定跑 Node.js，必须改。
- Worker 压缩后体积上限：免费 3 MiB，付费 10 MiB。
- `next/image` 优化需要 Cloudflare Images（按次计费）或自定义 loader。

## 0. 前置：结构调整

- [x] 删除 admin：`app/(admin)`、`app/api/auth`、`lib/auth`、`packages/db`
- [x] 去掉依赖 `@neondatabase/auth`、`@neondatabase/serverless`
- [x] `next.config.ts` 删 `/login → /admin/login` 重定向和 `transpilePackages`
- [x] `robots.ts` 去掉 `/admin`、`/api`
- [x] 去 monorepo：`apps/web/*` 移到根目录
  - [x] `packages/icons` → `components/icons`，生成脚本 → `scripts/generate-icons.mjs`
  - [x] `packages/theme` → `lib/theme`
  - [x] `packages/i18n` → `i18n/locales.ts`
  - [x] 合并 `package.json`、`tsconfig.json`，删除 `turbo.json`、`tsconfig.base.json`、workspaces
  - [x] `apps/replicas` → `resource/replicas`
  - [x] 更新脚本、文档里的 `apps/web/...` 路径（`scripts/*.mjs`、`resource/scripts/import-issue-text.mjs`、`docs/westbund-images.md`、`.prettierignore`、`.gitignore`）
  - [x] `bun install` 重建 `bun.lock`
- [x] `.env` 删掉 `DATABASE_URL`、`NEON_AUTH_BASE_URL`、`NEON_AUTH_COOKIE_SECRET`（原文件备份在废纸篓 `artifact-futures-restructure/root/.env.backup`）

## 1. 中间件

- [x] `proxy.ts` 只剩 next-intl 语言路由后，改回 `middleware.ts`（Edge 运行时；Next 16 已标记废弃但仍可用）
- [x] 确认 `/`、`/en`、`/en/journal/issues/issue-02` 跳转正常

## 2. 接入 OpenNext

- [x] Next 升到 16.3.8（OpenNext 1.20.8 要求 ≥ 16.3.8）
- [x] 安装 `@opennextjs/cloudflare`、`wrangler`
- [x] 新增 `open-next.config.ts`（全站静态，用静态资源增量缓存）、`wrangler.jsonc`（`nodejs_compat`、静态资源、`IMAGES` 绑定）
- [x] `next.config.ts` 开发环境接入 `initOpenNextCloudflareForDev()`
- [x] `package.json` 加 `preview`、`deploy`、`upload`、`cf-typegen` 脚本
- [x] `.gitignore` 加 `.open-next`、`.wrangler`、`.dev.vars`；`public/_headers` 给 `/_next/static/*` 加一年缓存
- [x] 本地 `opennextjs-cloudflare build` + `preview`，检查：首页 WebGL 与滚动、Journal 阅读页、字体、404
  - 修复：SWC 压缩把 `home-cloth.tsx` 里 `[foot.x, foot.y] = hold(...)` 压成非法的 `[0,0]=...`，首页整页 JS 报错黑屏（Vercel 生产构建同样受影响），改为普通赋值
  - 全部路由在 preview 下返回正确状态码；37 个客户端 JS 文件语法检查通过
- [x] 看构建出的 Worker 压缩体积：1.25 MiB（未压缩 5.8 MiB），免费版 3 MiB 内够用

## 3. 图片（需要 Cloudflare 账号）

- [x] `next/image` 优化方式：阅读页图片 `unoptimized`（已是压好的 WebP，直接从存储输出）；首页以外少量图片（Residency、Reel 扫描页）走 Cloudflare Images 绑定，免费版每月 5,000 次不重复转换足够
- [x] Issue 阅读页改为构建时静态生成（`generateStaticParams` + `dynamicParams = false`），全站不再有按需渲染的页面，避开免费版每次 10ms CPU 的限制
- [x] 决定存储：迁到 R2（不再用 Vercel）
- [ ] 迁 R2：迁完之前不能删 Blob 存储、不能关 Vercel 账号，否则图片全部裂开
  - [x] 盘点 Blob：815 个文件；要迁 734 个（126 MB）= `Westbund/issue-02/` 81、`home/pointer-covers/` 33、`journal/issue-01/en/` 204、`journal/issue-02/zh-en/` 416；`Westbund/migration/` 不迁
  - [x] 全部下载到 `resource/publish/r2/`（保持原路径，逐个核对大小），清单 `manifest.json`
  - [x] 代码里的图片域名收拢到 `lib/assets.ts` 的 `ASSET_ORIGIN`（`covers.ts`、`home-content.ts`、`reel-data.ts`、`issue-assets.ts`、`next.config.ts` 都从这里取）
  - [x] 上传与核对脚本 `scripts/r2-assets.mjs`（`bun run r2:upload`、`bun run r2:verify <域名>`）；核对逻辑已用现有 Blob 地址验证通过
  - [ ] 有账号后：`bunx wrangler login` → `bunx wrangler r2 bucket create artifact-futures-assets`
  - [ ] Cloudflare 控制台给 bucket 绑定自定义域名（如 `assets.artifactfutures.com`），或先开 r2.dev 公共地址
  - [ ] `bun run r2:upload` → `bun run r2:verify https://<域名>`
  - [ ] `lib/assets.ts` 的 `ASSET_ORIGIN` 改成新域名，`bun run preview` 检查

## 4. 部署与域名（需要 Cloudflare 账号）

- [x] Cloudflare 账户（新账号 `sophie@artifactfutures.com`，免费版）
- [x] 首次部署到测试网址 `https://journal.artifact-futures.workers.dev`（2026-10-05）
- [x] 只用 Sophie 账号，不处理 `artifactfutures.com`（DNS 在另一个账号）
- [ ] 部署方式：Workers Builds 连 GitHub，或 GitHub Actions + `wrangler deploy`
- [x] 环境变量与 secret：网站运行时不需要任何密钥（`BLOB_*` 只给本地上传脚本用）
- [ ] 分支预览环境
- [x] Worker 改名为 `journal`，测试网址 `https://journal.artifact-futures.workers.dev`
- [x] 删除改名前的旧 Worker `artifact-futures`

## 5. 收尾

- [x] 删除 `vercel.json`、`.gitignore` 里的 `.vercel`
- [ ] 上传脚本改用 R2，去掉 `@vercel/blob` 依赖和 Vercel OIDC 分支，更新 `docs/westbund-images.md`
- [ ] `.env` 删掉 `BLOB_STORE_ID`、`BLOB_READ_WRITE_TOKEN`；`next.config.ts` 的 `remotePatterns` 换成 R2 域名
- [ ] 图片全部切到 R2 并确认无引用后，Vercel 控制台删除 Blob 存储，最后注销/删除 Vercel 项目
- [x] 更新 README 的开发、部署说明
