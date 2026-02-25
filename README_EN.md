# Smart Favorites - Powerful Browser Bookmark Manager

English | [简体中文](./README.md) | [日本語](./README_JA.md)

Smart Favorites is a powerful browser extension designed to enhance bookmark management efficiency. Beyond basic folder categorization, it provides a tagging system, full-text search, versioned cloud backup (Supabase), and multi-language support.

## ✨ Features

### 📁 Core Management
- **Infinite Hierarchy**: Support for deep folder nesting to organize bookmarks flexibly.
- **Tagging System**: Multi-tag support for cross-category filtering.
- **Three View Modes**: Switch between List, Grid, and Card views.
- **Smart Sorting**: Sort by creation time, visit count, name, or last visit time.
- **Favicon Fetching**: Beautifully display website icons with configurable visibility.

### 🔄 Data Sync & Backup
- **Supabase Cloud Sync**: Versioned storage allowing multi-device synchronization.
- **Multi-Version Cloud Backup**: Records every sync snapshot, supporting selective restoration from history (up to 100 recent entries).
- **Auto-Retention Policy**: Configurable retention count (default 20, 0 for unlimited) to manage storage.
- **Automated Local Backup**: Optional periodic backups to local storage.
- **Cross-Platform Metadata**: Automatically records source Browser (Chrome/Edge/Firefox) and OS (Mac/Windows).

### ⌨️ Efficient Interaction
- **Quick Save**: One-click bookmarking via the context menu.
- **Global Shortcuts**: Millisecond-level search popup for quick bookmark lookup.
- **Customizable Shortcuts**: Support for both global and in-app shortcuts.

### 🌐 Internationalization
- **Multi-language Support**: Built-in English, Simplified Chinese, and Japanese, with automatic browser language detection.

## 🚀 Quick Start

### Development & Build

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Mode** (Hot Reload)
   ```bash
   npm run dev
   ```

3. **Build Extension** (For Browser)
   ```bash
   npm run build:extension
   ```

4. **Build Showcase Site** (For GitHub Pages)
   ```bash
   npm run build:web
   ```

### Installation
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `dist` folder.

## ☁️ Supabase Cloud Sync Setup

1. Create a new project on [Supabase](https://supabase.com/).
2. In the extension's "Auto Backup" menu, click "Copy Initial SQL".
3. Run the script in the Supabase SQL Editor to create the necessary table and Row Level Security (RLS) policies.
4. Fill in the project URL and Anon Key in the extension settings to enable sync.

## 🛠️ Tech Stack
- **Framework**: Vue 3 (Composition API) + TypeScript
- **UI Component**: Element Plus
- **State Management**: Pinia
- **Search Engine**: Fuse.js (Fuzzy Matching)
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL / RLS)

## 📂 Project Structure
```
src/
├── background/      # Service Worker (ContextMenu, Commands)
├── popup/           # Popup UI (Vue Components)
├── i18n/            # Locales (EN, ZH, JA)
├── services/        # Core Services (Storage, Supabase, Metadata)
├── stores/          # Pinia Stores (Bookmark, Category, Settings)
├── utils/           # Utilities
├── manifest.json    # Extension Manifest
├── index.html       # GitHub Pages Landing Page (ZH)
├── index_en.html    # GitHub Pages Landing Page (EN)
├── index_ja.html    # GitHub Pages Landing Page (JA)
└── scripts/         # Build Scripts (build-showcase.js)
```

## 📄 License
This project is licensed under the [MIT License](./LICENSE).

## 🤝 Contributing
Issues and Pull Requests are welcome.

---
*Smart Favorites v2.0.0 - Organize your bookmarks like a pro*
