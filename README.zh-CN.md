<div align="center">

# ARTIFACT Futures

**ARTIFACT Futures 线上平台（`Next.js 16` · `Three.js` · `WebGPU` · `GSAP` · `Cloudflare`）与独立运行的西岸 2026 三屏展览原型。**

[![Next.js](https://img.shields.io/badge/Next.js-16%20%7C%20React%2019-000000.svg)](#线上网站)
[![Graphics](https://img.shields.io/badge/Graphics-Three.js%20%7C%20WebGPU%20%7C%20GSAP-2563EB.svg)](#技术栈)
[![Deploy](https://img.shields.io/badge/Edge-Cloudflare%20OpenNext%20%7C%20R2-F38020.svg)](#线上网站)
[![Exhibition](https://img.shields.io/badge/Exhibition-West%20Bund%202026-10B981.svg)](#西岸-2026-展览原型)

[English](README.md) | **简体中文**

</div>

---

## 项目简介

本仓库包含 **ARTIFACT Futures** 的两套核心作品：

1. **西岸 2026 三屏展览原型（`exhibitions/westbund/`）**：无需安装任何依赖即可在浏览器打开的独立三屏交互预览，完整呈现 Issue 01 & 02 的观众动线模拟与动态版式效果。
2. **线上双语网站（`app/`、`components/`、`i18n/`）**：基于 Next.js 16 与 React 19 构建，结合 `Three.js` + `vgpu` WebGPU 着色器、`GSAP` + `Lenis` 动效编排，涵盖 Journal、Residency、Reel、CV 等栏目，并通过 Cloudflare OpenNext 与 R2 边缘分发。

## 西岸 2026 展览原型

无需安装依赖或启动 Next.js，直接打开 [`exhibitions/westbund/index.html`](exhibitions/westbund/index.html) 即可预览；或通过本地静态服务访问：

```sh
python3 -m http.server 3002 --bind 127.0.0.1 --directory exhibitions/westbund
# 浏览器打开 http://127.0.0.1:3002/
```

播放控制、观众模拟、`source.html` 源文件编辑与重新导出说明详见 [`exhibitions/westbund/README.md`](exhibitions/westbund/README.md)。历史方案与 12 份早期视觉研究归档于 [`archive/westbund/`](archive/westbund/README.md)。

## 线上网站

### 技术栈

| 层级 | 技术选型 |
| --- | --- |
| 框架与国际化 | Next.js 16、React 19、TypeScript、`next-intl` |
| 图形与动效 | Three.js、`vgpu`（WebGPU 着色器）、GSAP、Lenis |
| 部署与媒体 | Cloudflare Workers（`@opennextjs/cloudflare`）、Wrangler、R2 资源管线 |

### 本地开发

```sh
bun install
bun dev
```

### 校验与边缘预览

```sh
bun run check     # TypeScript 类型检查 + ESLint
bun run build     # Next.js 生产构建
bun run preview   # Cloudflare OpenNext 本地预览
```

R2 图床脚本与部署说明见 [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md) 与 [`docs/westbund-images.md`](docs/westbund-images.md)。

## 目录结构

```text
artifact-futures/
├── app/[locale]/            # 多语言路由（首页、Journal、Residency、Reel、CV）与着色器
├── components/              # 公共组件
├── exhibitions/westbund/    # 独立可运行的西岸 2026 三屏展览预览
├── archive/westbund/        # 历史网站展陈方案与 12 份设计研究归档
├── docs/                    # 品牌 SVG、Cloudflare 与展览图片管线文档
├── messages/                # 双语词条
└── scripts/                 # 图标生成、WebP 转换与 R2 资源上传脚本
```

## 参与贡献

欢迎提出视觉交互建议、Shader 性能优化或无障碍改进。提交 PR 前请运行 `bun run check && bun run build` 并参考 [CONTRIBUTING.md](CONTRIBUTING.md)。
