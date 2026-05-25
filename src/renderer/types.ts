/**
 * 应用类型定义
 *
 * 统一管理所有 TypeScript 接口和类型
 */

// ── 消息相关 ───────────────────────────────────────────────────────

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system';

/** 聊天消息 */
export interface Message {
  /** 唯一标识 */
  id: string;
  /** 发送者角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 时间戳 */
  timestamp: number;
}

// ── 工具相关 ───────────────────────────────────────────────────────

/** 工具配置 */
export interface ToolConfig {
  /** 工具 ID（对应 pi SDK 内置工具名） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 图标标识 */
  icon: string;
}

/** 预定义的工具配置列表 */
export const DEFAULT_TOOLS: ToolConfig[] = [
  { id: 'read', name: '读取文件', enabled: true, icon: 'file' },
  { id: 'bash', name: '执行命令', enabled: true, icon: 'terminal' },
  { id: 'grep', name: '搜索代码', enabled: true, icon: 'search' },
  { id: 'find', name: '查找文件', enabled: true, icon: 'folder' },
  { id: 'ls', name: '列出目录', enabled: true, icon: 'list' },
];

// ── 应用状态 ───────────────────────────────────────────────────────

/** AI 初始化状态 */
export type AIInitStatus = 'loading' | 'ready' | 'error';

// ── Electron IPC 类型 ──────────────────────────────────────────────

/**
 * Electron API 接口
 *
 * 由 preload.ts 通过 contextBridge 暴露到 window.electronAPI
 * 所有方法签名必须与 preload.ts 中的实现严格一致
 */
export interface ElectronAPI {
  // 消息
  sendMessage: (message: string) => Promise<{ success?: boolean; error?: string }>;

  // AI 事件监听（main → renderer）
  onAIDelta: (callback: (delta: string) => void) => void;
  onAIStreamEnd: (callback: () => void) => void;
  onAIInitSuccess: (callback: () => void) => void;
  onAIInitError: (callback: (message: string) => void) => void;
  removeAllAIListeners: () => void;

  // 窗口控制
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;

  // 工具配置
  getTools: () => Promise<string[]>;
  setTools: (tools: string[]) => Promise<{ success: boolean }>;
  getInitStatus: () => Promise<{ initialized: boolean }>;
}

/** 扩展 Window 接口 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
