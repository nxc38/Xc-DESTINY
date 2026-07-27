# Neaven-DESTINY

Destiny 2 桌面伴侣应用，支持 Bungie.net OAuth 登录、角色数据查看及装备管理。

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 43 |
| 前端 | React 19 + TypeScript 7 |
| 构建 | Vite 8 + vite-plugin-electron |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand 5 |
| HTTP | axios |
| 打包 | electron-builder (NSIS) |

## 项目结构

```
├── electron/                  # Electron 主进程
│   ├── main.ts                # 入口 — 剥离 OAuth 回调 URL，防止被误当模块路径
│   ├── app.ts                 # 窗口管理、自定义协议、单实例锁、IPC 处理器
│   ├── oauth.ts               # Bungie OAuth 2.0 认证（授权码模式）
│   ├── bungie.ts              # Bungie API 客户端（Node.js 环境，无 CORS/Origin 限制）
│   └── preload.ts             # contextBridge 安全桥接
├── src/                       # React 渲染进程
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 路由配置 + 登录守卫
│   ├── pages/
│   │   ├── LoginPage.tsx      # 登录页（OAuth 按钮、手动 URL 粘贴兜底）
│   │   └── DashboardPage.tsx  # 主界面（Sidebar + ContentArea 布局）
│   ├── components/
│   │   ├── Sidebar.tsx        # 左侧导航栏
│   │   ├── ContentArea.tsx    # 右侧内容区（Guardian 角色卡片等）
│   │   └── DestinyIcon.tsx    # Destiny SVG 图标库
│   ├── services/
│   │   └── bungie.ts          # Bungie API 封装（通过 IPC 调用主进程）
│   ├── store/
│   │   └── authStore.ts       # Zustand 认证状态
│   ├── types/
│   │   └── bungie.ts          # Bungie API TypeScript 类型
│   └── styles/
│       └── globals.css        # 全局样式 + Tailwind
├── resources/
│   └── icon.ico               # 应用图标
├── electron-builder.yml       # 打包配置
├── vite.config.ts             # Vite 构建配置
├── tailwind.config.js         # Tailwind 主题配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动 Vite 开发服务器 + Electron 窗口，支持 HMR 热更新。

### 构建

```bash
npm run build          # 编译前端 + Electron
npm run electron:build # 编译 + 打包为 Windows .exe
```

如需使用国内镜像加速 Electron/electron-builder 下载：

```powershell
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://registry.npmmirror.com/-/binary/electron-builder-binaries/"
npx electron-builder --win nsis
```

## OAuth 认证流程

```
用户点击"Login with Bungie.net"
  → 浏览器打开 Bungie 授权页
  → 用户授权
  → Bungie 重定向到 neavendestiny://oauth/callback?code=xxx
  → Windows 将协议请求交给 Electron 应用
  → 应用已运行：second-instance 事件捕获 code
  → 应用未运行：冷启动，剥离 argv 后处理
  → POST code 到 Bungie Token API → 获取 access_token
  → IPC 通知渲染进程 → 跳转 Dashboard
```

### 手动登录（协议注册失败时）

登录页提供 "Trouble logging in? Manual entry" 入口，可手动粘贴浏览器地址栏中的 `neavendestiny://oauth/callback?code=...` URL。

## Bungie API 配置

1. 在 [Bungie Developer Portal](https://www.bungie.net/en/Application) 创建应用
2. 获取 API Key 和 Client ID
3. 配置 OAuth 回调 URL：`neavendestiny://oauth/callback`
4. 将 API Key 填入 `electron/bungie.ts`，Client ID 填入 `electron/oauth.ts`

## 自定义协议注册说明

应用使用 `app.setAsDefaultProtocolClient('neavendestiny')` 注册 Windows 自定义协议。开发模式下的关键点：

- 注册的命令行为 `electron.exe "项目根目录" "%1"`，其中 `%1` 为 OAuth 回调 URL
- 如果注册不完整（缺少项目根目录参数），冷启动时 Electron 会将 URL 误解析为模块路径
- `electron/main.ts` 在 Electron 模块加载前剥离 `process.argv` 中的协议 URL 作为额外防护

## 颜色主题

| 颜色 | 色值 | 用途 |
|---|---|---|
| Primary | `#7C3AED` | 主色调 |
| Primary Dark | `#5B21B6` | 深色背景 |
| Primary Light | `#A78BFA` | 辅助文字 |
| Background | `#0F0F1A` | 页面背景 |
| Surface | `#1A1A2E` | 卡片/侧栏背景 |
| Accent Gold | `#F59E0B` | Destiny Tricorn 金色 |

## License

MIT
