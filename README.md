# 📁 Organize

**Organize** is a high-performance, rule-based file management engine for Windows. Built with **Next.js 16** and **Tauri v2 (Rust)**, it provides a safe, ultra-fast way to keep your folders clean without manual effort.

![Branding](src-tauri/icons/128x128.png)

## 🚀 Key Features

- **⚡ Blazing Fast Engine**: Powered by Rust, utilizing parallel processing for sub-second analysis of thousands of files.
- **🛡️ Safety First**: Preview mode shows exactly what will happen before any disk changes occur.
- **🔄 Undo System**: Mistake? No problem. Every organization run is logged and can be fully reversed.
- **📐 Flexible Rules**: Filter files by extension, name matching, or size.
- **🎨 Modern UI**: Premium glassmorphic interface with reactive feedback and skeleton loading.
- **🔒 Secure by Design**: Hardened IPC, scoped filesystem access, and system-folder protection.

## 📦 Downloads (v0.1.0)

Grab the latest production installer for Windows:

- [**Download EXE Installer** (Recommended)](src-tauri/builds/nsis/organize_0.1.0_x64-setup.exe)
- [**Download MSI Installer**](src-tauri/builds/msi/organize_0.1.0_x64_en-US.msi)

## 🛠️ Getting Started (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (Stable)
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows)

### Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   npm --prefix frontend install
   ```
3. Run in development mode:

   ```bash
   npm run tauri dev
   ```

### Build for Production

```bash
npm run tauri build
```

## 🏗️ Architecture

- **Frontend**: React 19 / Next.js 16 (Static Export)
- **Backend**: Rust (Tauri v2)
- **Database**: SQLite
- **Styling**: Tailwind CSS
