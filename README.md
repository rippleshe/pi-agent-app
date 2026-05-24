# 💬 AI 编码助手

基于 pi-coding-agent 和 Electron 的智能编码助手，支持命令行和图形界面两种使用方式。

## ✨ 特性

- 🤖 **AI 驱动** - 使用 DeepSeek V4 Flash 模型
- 💬 **图形界面** - 现代化的聊天对话框
- ⚡ **流式输出** - 打字机效果的实时响应
- 🔧 **多功能** - 读取文件、执行命令、搜索代码
- 📦 **轻量级** - 原生 HTML/CSS/JS，无构建工具依赖

## 🚀 快速开始

### 方式 1：命令行版本

```bash
pnpm install
pnpm dev
```

### 方式 2：Electron 桌面应用

```bash
pnpm install
pnpm approve-builds  # 首次运行需要
pnpm electron
```

## 📁 项目结构

```
pi-agent-app/
├── src/
│   ├── index.ts              # 命令行版本入口
│   ├── electron-main.ts      # Electron 主进程
│   ├── preload.ts            # 预加载脚本
│   └── renderer/
│       ├── index.html        # 前端界面（骨架）
│       ├── styles.css        # 样式文件（分离）
│       └── electron.d.ts     # TypeScript 类型定义
├── docs/                     # 文档目录
│   ├── QUICKSTART.md         # 快速启动指南
│   ├── CODE_REVIEW.md        # 代码审查报告
│   ├── TYPESCRIPT_GUIDE.md   # TypeScript 学习指南
│   └── ELECTRON_README.md    # Electron 版本指南
├── .env                      # 环境变量（需自行创建）
├── package.json
└── tsconfig.json
```

## 📚 文档

- **[快速启动](docs/QUICKSTART.md)** - 3 分钟快速开始教程
- **[代码审查](docs/CODE_REVIEW.md)** - 代码质量报告（5/5 评分）
- **[TypeScript 指南](docs/TYPESCRIPT_GUIDE.md)** - 语法详解（10 个核心概念）
- **[Electron 指南](docs/ELECTRON_README.md)** - Electron 版本使用说明

## 🎯 使用示例

可以向 AI 提问：

1. "当前目录下有哪些文件？"
2. "读取 package.json 的内容"
3. "帮我写一个计算斐波那契数列的函数"
4. "搜索所有 .ts 文件中的 async 关键字"
5. "介绍一下这个项目的结构"

## 🛠️ 技术栈

- **Electron** - 桌面应用框架
- **TypeScript** - 类型安全
- **pi-coding-agent** - AI 编码代理 SDK
- **原生 HTML/CSS/JS** - 轻量级前端

## 📝 环境变量

需要在项目根目录创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
```

## 🎓 学习价值

本项目适合学习：

- ✅ TypeScript 基础（有详细注释）
- ✅ Electron 架构（主进程/渲染进程/IPC）
- ✅ 进程间通信机制
- ✅ 安全最佳实践（preload 脚本）
- ✅ 前端工程（HTML/CSS/JS 分离）

## 📄 许可证

MIT

---

**最后更新：** 2026-05-23
