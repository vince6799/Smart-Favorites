# 智能收藏夹 - 强大的浏览器书签管理工具

[English](./README_EN.md) | 简体中文 | [日本語](./README_JA.md)

智能收藏夹 (Smart Favorites) 是一款功能强大的浏览器扩展，旨在提升书签管理效率。除了基础的文件夹分类，它还提供了标签系统、全文搜索、版本化云端备份（Supabase）以及多语言支持。

## ✨ 功能特性

### 📁 核心管理
- **无限层级分类**：支持深度文件夹嵌套，灵活组织书签。
- **标签系统**：多标签支持，跨分类筛选。
- **三种视图模式**：列表、网格、卡片视图随心切换。
- **智能排序**：支持按创建时间、访问次数、名称或最后访问时间排序。
- ** favicon 自动抓取**：美观地展示网站图标，支持自定义显示。

### 🔄 数据同步与备份
- **Supabase 云端同步**：版本化存储，支持多设备同步。
- **多版本云备份**：记录每一次同步快照，支持从历史记录（最近100条）中选择性还原。
- **自动保留策略**：可自定义云端保留条数（默认20），节省存储空间。
- **自动化本地备份**：可选自动定期备份到本地存储。
- **全平台兼容元数据**：自动记录备份来源的浏览器（Chrome/Edge/Firefox）和操作系统（Mac/Windows）。

### ⌨️ 高效交互
- **快速保存**：右键菜单一键收藏网页。
- **全局快捷键**：毫秒级呼出搜索界面，快速查找书签。
- **快捷键直达**：支持自定义全局及应用内快捷键。

### 🌐 国际化
- **多语言支持**：内置英文、简体中文、日文，自动识别浏览器语言。

## 🚀 快速开始

### 开发与构建

1. **安装依赖**
   ```bash
   npm install
   ```

2. **开发模式** (实时热重载)
   ```bash
   npm run dev
   ```

3. **打包插件** (Chrome 扩展)
   ```bash
   npm run build:extension
   ```

4. **构建展示站点** (用于 GitHub Pages)
   ```bash
   npm run build:web
   ```

### 插件安装
1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择项目中的 `dist` 目录。

## ☁️ Supabase 云同步设置

1. 在 [Supabase](https://supabase.com/) 创建新项目。
2. 在插件的“自动备份”菜单中，点击“复制初始化 SQL”。
3. 在 Supabase 的 SQL Editor 中运行该脚本以创建必要的表和安全策略 (RLS)。
4. 将项目的 URL 和 Anon Key 填写到插件设置中即可开启同步。

## 🛠️ 技术栈
- **前端框架**: Vue 3 (Composition API) + TypeScript
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **搜索算法**: Fuse.js (模糊匹配)
- **构建工具**: Vite
- **后端支持**: Supabase (PostgreSQL / RLS)

## 📂 项目结构
```
src/
├── background/      # 后台 Service Worker (右键菜单、命令监听)
├── popup/           # 插件弹窗主界面 (Vue 组件)
├── i18n/            # 国际化语言包 (EN, ZH, JA)
├── services/        # 核心服务 (Storage, Supabase, Metadata)
├── stores/          # 全局状态管理 (书签, 分类, 设置)
├── utils/           # 工具函数
├── manifest.json    # 插件清单文件
├── index.html       # GitHub Pages 落地页 (中)
├── index_en.html    # GitHub Pages 落地页 (英)
├── index_ja.html    # GitHub Pages 落地页 (日)
└── scripts/         # 构建脚本 (build-showcase.js)
```

## 📄 许可证
本项目采用 [MIT License](./LICENSE) 开源。

## 🤝 贡献
欢迎提交 Issue 和 Pull Request。

---
*Smart Favorites v2.0.0 - 让收藏更有条理*
