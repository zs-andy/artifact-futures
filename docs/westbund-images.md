# Westbund 阅读器图片发布

只处理新版 Issue 阅读器的图片。首页、Archive 和 Demo 的图片不变。

当前 Issue 02 的内部标识是 `issue-02`，对应主题 Migration, Fluidity, Resilience。
脚本从阅读器数据中收集实际使用的图片，不会把整个原始素材目录上传。

## 1. 准备图片（不联网、不上传）

在工程根目录执行：

```sh
bun run westbund:prepare
```

输出：

- `resource/publish/Westbund/issue-02/`：按 Project 分好的 81 张 WebP，共约 12.6 MB。
- `resource/publish/issue-02.manifest.json`：每张图片的本地路径、Blob 路径、宽高、文件大小、SHA-256。

Blob 路径示例：

```text
Westbund/issue-02/a-wet-wet-market/01-<内容哈希>.webp
Westbund/issue-02/rehoming-dundun/01-<内容哈希>.webp
```

`Westbund` 保留大小写。文件名中的 12 位哈希由图片内容生成，相同图片重复准备得到相同路径；图片更新则产生新路径，避免浏览器继续使用旧缓存。

生成目录位于已忽略的 `resource/` 内，不会把原始素材或重复的上传副本带入 Git。

## 2. 由你执行上传

把目标 Vercel Blob store 的 `BLOB_READ_WRITE_TOKEN` 放在根目录被 Git 忽略的 `.env` 中。不要使用 `NEXT_PUBLIC_` 前缀。

```sh
bun run westbund:upload
```

也支持现有环境中的 `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`。显式提供的 Blob token 优先。

脚本会使用 **public** Blob，按清单写入 `Westbund/`，不会创建随机后缀、覆盖已有对象或删除文件。每成功一张就保存进度到 `resource/publish/issue-02.uploaded.json`。

中断后重新执行同一命令即可。已有同名文件会下载比对 SHA-256；内容不同则报错，不会悄悄复用。上传结束后，阅读器仍使用当前地址。

## 3. 检查成功后切换阅读器地址

```sh
bun run westbund:apply
```

这一步不上传。它先确认本地素材没有改变，再逐张下载已上传图片，验证 URL、HTTP 状态和完整内容哈希。必须全部通过，才会一次性更新：

```text
app/[locale]/journal/_lib/reader-image-urls.json
```

阅读器从这个映射取 Blob 地址；Next.js 图片域名配置也读取它，只放行实际用到的 store 的 `/Westbund/**`。原始内容数据与本地图片保留，重新导入 Issue 文本不会清空映射。尚未发布的图片继续使用站内路径。

将脚本、阅读器接入代码、`next.config.ts` 和生成的 URL 映射一起纳入下次提交/部署。**上传 Blob 并不等于网站已经部署。**

如果改动了图片，依次重新执行 prepare、upload、apply。若需回退地址，可还原映射文件；清空为 `{}` 时使用本地图片，部署中须仍包含这些本地文件。

## 用 Vercel 控制台手动上传

也可以上传准备好的文件，保持清单中的完整文件夹层级与文件名。完成后指定实际 store 的根地址：

```sh
bun run westbund:apply issue-02 --base-url https://<store>.public.blob.vercel-storage.com
```

不要在 `--base-url` 中加 `/Westbund`。脚本会用清单拼接路径，并做同样的逐张校验；目录或文件名不一致会报错，不会修改阅读器地址。

## 本地验证

```sh
bun test scripts/westbund-images.test.ts
bun run typecheck
```

离线测试不连接 Blob，也不会上传。`prepare` 已验证全部 81 张实际图片的格式、尺寸和解码；真正的上传和远端校验需在你执行上传之后完成。
