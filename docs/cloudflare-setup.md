# Cloudflare 上线清单

从零开始，把官网和图片放到 Cloudflare。按顺序做，每一步都写了"做什么、为什么、做完应该看到什么"。卡住了把报错原样发给 Claude。

先认识四个名词：

| 名词 | 是什么 | 在我们这里干嘛 |
|---|---|---|
| **Workers** | Cloudflare 跑代码的地方 | 跑整个官网（Next.js 被 OpenNext 打包成一个 Worker） |
| **R2** | 文件存储，类似 Vercel Blob | 放图片（734 个，126 MB），流量不收费 |
| **wrangler** | Cloudflare 的命令行工具，已装在项目里 | 在本机登录、建 R2、部署 |
| **DNS / 域名服务器** | 决定 `artifactfutures.com` 指向哪台服务器 | 最后一步把域名交给 Cloudflare 管 |

全程免费：Workers 免费版每天 10 万次请求，R2 每月 10 GB 免费且流量免费，图片优化每月 5,000 次免费。超额也不会自动扣钱。

---

## 0. 开始前（5 分钟）

- [ ] 把当前改动提交到 git（删后台、去 monorepo、Cloudflare 配置都还没提交）。不提交也能部署，但出问题时没法回退
- [ ] 确认本地预览正常：`bun run preview`，浏览器打开 `http://localhost:8787`，看完在终端按 `x` 退出
- [ ] 弄清 `artifactfutures.com` 是在哪里买的（Wix、GoDaddy、Namecheap、阿里云……），并且你能登录那个后台。第 5 步要用。不确定的话，在 [whois.com](https://www.whois.com/whois/artifactfutures.com) 查 Registrar 一栏

## 1. 注册账号（10 分钟）

- [ ] 打开 [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)，用常用邮箱注册，去邮箱点验证链接
- [ ] 右上角头像 → **My Profile** → **Authentication**，开启两步验证（2FA）。这个账号以后管着网站和域名，丢了很麻烦
- [ ] 登录后首页可能会让你"添加网站"，**先跳过**，第 5 步再做

做完：能登录控制台，左侧菜单里能看到 **Workers & Pages**、**R2 Object Storage**。

## 2. 本机登录 wrangler（2 分钟）

```bash
bunx wrangler login
```

会自动打开浏览器，点 **Allow**。然后确认：

```bash
bunx wrangler whoami
```

做完：终端显示你的邮箱和 Account ID。登录凭据只存在你电脑上，不会进 git。

## 3. 先部署一次，拿到测试网址（10 分钟）

这一步网站还用 Vercel Blob 上的图，只是确认网站能在 Cloudflare 上跑起来，不影响现在的线上站。

```bash
bun run deploy
```

- 第一次会问你注册一个 `workers.dev` 子域名（例如 `artifact`），随便取，以后测试网址就是 `https://artifact-futures.<子域名>.workers.dev`
- 构建大约 1–2 分钟，结束时终端会打印网址

做完：打开那个网址，首页、`/en/journal/issues/issue-02`、`/en/residency` 都正常。控制台 **Workers & Pages** 里出现 `artifact-futures`。

## 4. 建 R2，上传图片（30 分钟，多数时间在等上传）

### 4.1 开通 R2

- [ ] 控制台左侧 **R2 Object Storage** → 按提示开通。可能要求绑定一张卡，这是 Cloudflare 的规定；免费额度内不会扣费

### 4.2 建 bucket（存储桶，可以理解成一个文件夹）

```bash
bunx wrangler r2 bucket create artifact-futures-assets
```

做完：控制台 R2 列表里出现 `artifact-futures-assets`。

### 4.3 上传 734 个图片

图片已经下载好在 `resource/publish/r2/`，路径和 Blob 上完全一样。

```bash
bun run r2:upload
```

- 一个个传，大约 10–20 分钟，终端显示 `[123/734] ...`
- 中途断了直接重跑同一条命令，传过的会跳过

做完：最后一行是 `All 734 objects are in artifact-futures-assets`。

### 4.4 开一个临时公开地址，核对

- [ ] 控制台 → R2 → `artifact-futures-assets` → **Settings** → **Public Development URL**（r2.dev）→ **Enable**，会得到一个 `https://pub-xxxx.r2.dev` 地址
- [ ] 核对所有文件都能访问：

```bash
bun run r2:verify https://pub-xxxx.r2.dev
```

做完：显示 `All 734 objects verified`。

> r2.dev 地址有访问频率限制，只用来测试，正式上线用第 6 步的自定义域名。

## 5. 把域名交给 Cloudflare 管（操作 15 分钟，生效等几分钟到 24 小时）

这一步最需要小心，因为域名还连着现在的线上站和**邮箱**。

- [ ] 控制台首页 → **Add a domain**，输入 `artifactfutures.com`，选 **Free** 计划
- [ ] Cloudflare 会自动扫描并导入现有 DNS 记录。**逐条核对，尤其是**：
  - `MX` 记录：邮箱用的，少了会收不到邮件
  - `TXT` 记录：邮箱验证（SPF、DKIM）、Google 等服务的验证
  - `A` / `CNAME` 记录：现在的网站
  
  对照原来域名后台的 DNS 列表，缺的手动补上。**这时候先不要删任何记录**，现在的网站会照常运行
- [ ] Cloudflare 会给你两个域名服务器地址，形如 `xxx.ns.cloudflare.com`
- [ ] 登录域名购买的那个后台，把 **Nameservers（域名服务器）** 改成这两个
- [ ] 回 Cloudflare 点 **Check nameservers**，等状态变成 **Active**（会发邮件通知）

做完：Cloudflare 里域名显示 Active；现在的网站和邮箱都照常工作（因为记录是原样搬过来的）。

## 6. 图片换成正式域名（15 分钟）

- [ ] R2 → `artifact-futures-assets` → **Settings** → **Custom Domains** → **Connect Domain**，填 `assets.artifactfutures.com`，确认。Cloudflare 会自动加好 DNS 记录
- [ ] 核对：

```bash
bun run r2:verify https://assets.artifactfutures.com
```

- [ ] 把 `lib/assets.ts` 里的 `ASSET_ORIGIN` 改成 `https://assets.artifactfutures.com`（或者让 Claude 改），然后：

```bash
bun run preview
```

确认图片都正常，再：

```bash
bun run deploy
```

- [ ] 第 4.4 步的 r2.dev 公开地址可以关掉了

做完：测试网址上的图片地址都变成 `assets.artifactfutures.com/...`。

## 7. 正式切换：域名指向新网站（15 分钟）

这一步之后，访问 `artifactfutures.com` 看到的就是新网站，旧站下线。挑个访问少的时间做。

- [ ] 让 Claude 在 `wrangler.jsonc` 里加上域名配置（`artifactfutures.com` 和 `www.artifactfutures.com`）。或者在控制台 **Workers & Pages** → `artifact-futures` → **Settings** → **Domains & Routes** → **Add** → **Custom domain** 里手动加
- [ ] 如果提示该域名已有 DNS 记录，到 **DNS** 页删掉旧网站的那条 `A` / `CNAME`（**只删网站的，不要动 MX、TXT**），再重新添加
- [ ] `bun run deploy`

做完：`https://artifactfutures.com/en` 是新网站，浏览器显示安全锁（HTTPS 证书 Cloudflare 自动签发，可能要等几分钟）。邮箱照常收发。

## 8. 自动部署（可选，20 分钟）

不做也行，每次手动 `bun run deploy`。想推送代码后自动上线：

- [ ] **Workers & Pages** → `artifact-futures` → **Settings** → **Builds** → 连接 GitHub，选这个仓库
- [ ] Build command：`bunx opennextjs-cloudflare build`
- [ ] Deploy command：`bunx opennextjs-cloudflare deploy`
- [ ] 生产分支选 `main`

做完：推送到 `main` 后，控制台 **Deployments** 里能看到自动构建和部署。

## 9. 观察一周后，清理 Vercel

- [ ] 网站、图片、邮箱都稳定后，告诉 Claude：删掉 `@vercel/blob` 依赖、`.env` 里的 `BLOB_*`，Issue 图片上传脚本改成传 R2
- [ ] Vercel 控制台：先删 Blob 存储，再删项目
- [ ] 如果域名原来连着 Wix 等旧平台，确认不再需要后取消对应服务

---

## 常见问题

- **`bun run deploy` 报 not authenticated**：重新 `bunx wrangler login`
- **上传报错或卡住**：直接重跑 `bun run r2:upload`，会从断点继续
- **改了 Nameservers 很久没生效**：一般几十分钟，最长 24 小时；确认填的是 Cloudflare 给的那两个，没有多余空格
- **切换后邮件收不到**：到 Cloudflare **DNS** 页对照原来的 MX、TXT 记录补齐
- **网站白屏或报错**：控制台 Worker → **Logs**（或终端 `bunx wrangler tail`）看实时日志，发给 Claude
- **想回到旧站**：把第 7 步加的 Custom domain 删掉，再恢复旧网站的 DNS 记录
