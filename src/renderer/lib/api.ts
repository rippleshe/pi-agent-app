/**
 * 统一 API 层
 *
 * 解决的问题：pnpm vite:dev（纯浏览器）和 pnpm electron（Electron 桌面）
 * 两种模式下，应用使用同一套 API 接口。
 *
 * 【策略模式】
 * 根据运行环境选择不同的"策略"：
 * - Electron 环境 → 使用 window.electronAPI（IPC 通信）
 * - 浏览器环境   → 使用 MockAPI（模拟流式输出）
 *
 * 调用方不需要关心底层是哪种，统一用 AppAPI.xxx() 即可。
 */

import type { ElectronAPI } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Mock API：浏览器开发模式
// ═══════════════════════════════════════════════════════════════════

/**
 * 模拟 AI 响应内容（演示用）
 *
 * 开发时你可以修改这些内容来测试不同的 UI 状态。
 */
const MOCK_RESPONSES = [
  '你好！这是一个模拟的 AI 响应。\n\n当前运行在浏览器开发模式下，AI 功能由 Mock API 提供。\n\n要使用真实的 AI 功能，请运行：\n```bash\npnpm electron\n```\n\n这会启动 Electron 桌面应用，连接 DeepSeek V4 Flash 模型。',
  '这是一个代码示例：\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```\n\n你可以看到代码块的高亮和复制功能正常工作。',
  '当前目录结构：\n\n```\npi-agent-app/\n├── src/\n│   ├── electron-main.ts   # 主进程\n│   ├── preload.ts         # 安全桥\n│   └── renderer/          # React 前端\n│       ├── App.tsx\n│       ├── components/\n│       └── lib/\n├── package.json\n└── .env\n```\n\n这是一个基于 pi-coding-agent SDK 的 AI 编码助手。',
];

/** 轮询索引，让每次对话返回不同的模拟回复 */
let mockResponseIndex = 0;

/**
 * 模拟流式输出
 *
 * 逐字符发送文本，模拟 AI 的打字效果。
 * 每个字符间隔 20ms，模拟真实的网络延迟。
 *
 * @param text - 要逐字输出的文本
 * @param onDelta - 每输出一个字符/词时的回调
 * @param onEnd - 全部输出完成时的回调
 */
function simulateStreaming(
  text: string,
  onDelta: (delta: string) => void,
  onEnd: () => void,
) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      // 每次输出 1-3 个字符，模拟不均匀的流式输出
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const chunk = text.slice(i, i + chunkSize);
      onDelta(chunk);
      i += chunkSize;
    } else {
      clearInterval(interval);
      onEnd();
    }
  }, 20);
}

/**
 * 创建浏览器 Mock API
 *
 * 实现了 ElectronAPI 接口，但用 setTimeout 模拟异步行为。
 */
function createMockAPI(): ElectronAPI {
  // 存储事件回调（模拟 EventEmitter）
  const listeners: Record<string, Function[]> = {
    'ai-stream-delta': [],
    'ai-stream-end': [],
    'ai-init-success': [],
    'ai-init-error': [],
  };

  // 模拟初始化延迟（1 秒后触发成功事件）
  setTimeout(() => {
    listeners['ai-init-success'].forEach(cb => cb());
  }, 1000);

  return {
    sendMessage: async (message: string) => {
      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 300));

      // 获取模拟回复（轮询）
      const response = MOCK_RESPONSES[mockResponseIndex % MOCK_RESPONSES.length];
      mockResponseIndex++;

      // 模拟流式输出
      simulateStreaming(
        response,
        // onDelta: 触发所有 'ai-stream-delta' 监听器
        (delta) => listeners['ai-stream-delta'].forEach(cb => cb(delta)),
        // onEnd: 触发所有 'ai-stream-end' 监听器
        () => listeners['ai-stream-end'].forEach(cb => cb()),
      );

      return { success: true };
    },

    onAIDelta: (cb) => listeners['ai-stream-delta'].push(cb),
    onAIStreamEnd: (cb) => listeners['ai-stream-end'].push(cb),
    onAIInitSuccess: (cb) => listeners['ai-init-success'].push(cb),
    onAIInitError: (cb) => listeners['ai-init-error'].push(cb),
    removeAllAIListeners: () => {
      Object.keys(listeners).forEach(k => listeners[k] = []);
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

// ═══════════════════════════════════════════════════════════════════
// 导出统一 API
// ═══════════════════════════════════════════════════════════════════

/**
 * 【自动检测环境】
 * window.electronAPI 存在 → Electron 环境
 * window.electronAPI 不存在 → 浏览器开发环境（使用 Mock）
 *
 * ?? 是空值合并运算符：左边是 null/undefined 时返回右边
 */
export const api: ElectronAPI = window.electronAPI ?? createMockAPI();

/** 是否运行在 Electron 环境中 */
export const isElectron = !!window.electronAPI;
