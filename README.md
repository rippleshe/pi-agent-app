# AI 编码助手

基于 pi-coding-agent SDK + Electron + React 的智能编码助手桌面应用。

## 特性

- **AI 驱动** — DeepSeek V4 Flash 模型，支持 1M 上下文窗口
- **图形界面** — React + Tailwind CSS 构建的现代化聊天界面
- **流式输出** — 打字机效果的实时响应
- **多功能工具** — 读取文件、执行命令、搜索代码、查找文件、列出目录
- **自定义标题栏** — 无边框窗口 + 原生风格的窗口控制按钮
- **暗色模式** — 自动跟随系统主题
- **无障碍** — 支持 prefers-reduced-motion、焦点环、aria 标签

## 快速开始

```bash
pnpm install
pnpm approve-builds   # 首次运行需要，允许 electron 构建
pnpm electron         # 启动 Electron 桌面应用
```

## 项目结构

```
src/
├── electron-main.ts          # Electron 主进程（AI 会话 + IPC + 窗口管理）
├── preload.ts                # 安全桥（暴露 IPC API 给 renderer）
├── cli.ts                    # 命令行版本入口（独立于 Electron）
└── renderer/
    ├── index.html            # HTML 入口
    ├── main.tsx              # React 挂载点
    ├── App.tsx               # 根组件（状态管理 + 布局）
    ├── index.css             # 全局样式 + CSS 变量（语义化设计系统）
    ├── types.ts              # TypeScript 类型定义
    ├── lib/
    │   ├── utils.ts          # cn() 工具函数
    │   └── icons.ts          # 共享图标映射
    └── components/
        ├── TitleBar.tsx       # 自定义标题栏（窗口拖拽 + 控制按钮）
        ├── ChatArea.tsx       # 聊天区域（消息列表 + 输入框 + 状态栏）
        ├── MessageBubble.tsx  # 消息气泡（代码块格式化 + 复制按钮）
        ├── Sidebar.tsx        # 侧边栏（工具开关 + 操作按钮）
        ├── SettingsPanel.tsx  # 设置面板（模态弹窗）
        ├── ToggleSwitch.tsx   # 无障碍切换开关
        └── TypingIndicator.tsx # 打字指示器动画
```

## 架构

```
主进程 (electron-main.ts)
  ├── pi-coding-agent SDK → AI 会话管理
  ├── IPC 处理器 ← renderer 请求
  └── 事件推送 → renderer
  
预加载 (preload.ts)
  └── contextBridge → 安全暴露 API

渲染进程 (renderer/)
  ├── React 组件树 → UI
  └── window.electronAPI → 与主进程通信
```

## 环境变量

在项目根目录创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
```

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 35 |
| 前端 | React 19 + TypeScript 6 |
| 构建 | Vite 8 + Tailwind CSS 4 |
| AI SDK | pi-coding-agent 0.75.4 |
| 动画 | Framer Motion |
| 图标 | Lucide React |

## 许可证

MIT
