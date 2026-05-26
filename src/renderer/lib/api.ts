/**
 * 统一 API 层 — Electron IPC / 浏览器 Mock 自动切换
 */

import type { ElectronAPI } from '../types';

// ── Mock 响应内容 ──────────────────────────────────────────────────
const MOCK_RESPONSES = [
  `你好！我是一个基于 DeepSeek V4 Flash 的 AI 编码助手。\n\n我可以帮你：\n- 读取和分析项目文件\n- 搜索代码中的关键信息\n- 执行 shell 命令\n- 编写和修改代码\n\n当前运行在浏览器开发模式下。要使用真实 AI，请运行 \`pnpm electron\` 启动桌面应用。`,
  `这是一个 TypeScript 代码示例：\n\n\`\`\`typescript\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nasync function fetchUser(id: string): Promise<User> {\n  const res = await fetch(\`/api/users/\${id}\`);\n  return res.json();\n}\n\`\`\`\n\n你可以看到代码块有语法高亮和一键复制功能。`,
  `当前项目结构：\n\n\`\`\`\npi-agent-app/\n├── src/\n│   ├── electron-main.ts    # Electron 主进程\n│   ├── preload.ts          # 安全桥\n│   ├── cli.ts              # 命令行入口\n│   └── renderer/           # React 前端\n│       ├── App.tsx          # 根组件\n│       ├── components/      # UI 组件\n│       └── lib/             # 工具函数\n├── package.json\n└── .env                    # API Key\n\`\`\`\n\n这是一个基于 pi-coding-agent SDK 的 Electron 桌面应用。`,
];

let mockIndex = 0;

// ── 流式输出模拟（确保 onEnd 一定会被调用）─────────────────────────
function simulateStreaming(text: string, onDelta: (d: string) => void, onEnd: () => void) {
  let i = 0;
  function tick() {
    if (i < text.length) {
      const chunkSize = Math.min(Math.floor(Math.random() * 4) + 1, text.length - i);
      onDelta(text.slice(i, i + chunkSize));
      i += chunkSize;
      setTimeout(tick, 12 + Math.random() * 8);
    } else {
      onEnd(); // 保证调用
    }
  }
  // 首帧延迟一小段，让 UI 先显示等待状态
  setTimeout(tick, 100);
}

// ── Mock API 工厂 ──────────────────────────────────────────────────
function createMockAPI(): ElectronAPI {
  const cbs = {
    delta: [] as ((d: string) => void)[],
    end: [] as (() => void)[],
    initOk: [] as (() => void)[],
    initErr: [] as ((msg: string) => void)[],
  };

  // 模拟 AI 初始化（300ms 后就绪）
  setTimeout(() => cbs.initOk.forEach(fn => fn()), 300);

  return {
    sendMessage: async (_message: string) => {
      const response = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
      mockIndex++;
      simulateStreaming(
        response,
        (delta) => cbs.delta.forEach(fn => fn(delta)),
        () => cbs.end.forEach(fn => fn()),
      );
      return { success: true };
    },

    onAIDelta: (cb) => { cbs.delta.push(cb); },
    onAIStreamEnd: (cb) => { cbs.end.push(cb); },
    onAIInitSuccess: (cb) => { cbs.initOk.push(cb); },
    onAIInitError: (cb) => { cbs.initErr.push(cb); },
    removeAllAIListeners: () => {
      cbs.delta = []; cbs.end = []; cbs.initOk = []; cbs.initErr = [];
    },

    windowMinimize: async () => {},
    windowMaximize: async () => {},
    windowClose: async () => {},
    windowIsMaximized: async () => false,
    getTools: async () => ['read', 'bash', 'grep', 'find', 'ls'],
    setTools: async () => ({ success: true }),
    getInitStatus: async () => ({ initialized: true }),
  };
}

// ── 导出 ───────────────────────────────────────────────────────────
export const api: ElectronAPI = window.electronAPI ?? createMockAPI();
export const isElectron = !!window.electronAPI;
