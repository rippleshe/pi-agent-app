/**
 * 类型定义文件
 * 
 * 定义应用中使用的 TypeScript 类型和接口
 */

/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 聊天消息接口
 */
export interface Message {
  /** 消息唯一标识 */
  id: string;
  
  /** 消息发送者角色 */
  role: MessageRole;
  
  /** 消息内容 */
  content: string;
  
  /** 消息时间戳 */
  timestamp: number;
}

/**
 * 工具配置接口
 */
export interface ToolConfig {
  /** 工具唯一标识 */
  id: string;
  
  /** 工具显示名称 */
  name: string;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 工具图标类型 */
  icon: string;
}

/**
 * 会话接口
 */
export interface Session {
  /** 会话唯一标识 */
  id: string;
  
  /** 会话标题 */
  title: string;
  
  /** 最后一条消息预览 */
  lastMessage?: string;
  
  /** 最后活跃时间 */
  lastActive: number;
  
  /** 消息数量 */
  messageCount: number;
}

/**
 * Electron API 类型定义
 * 用于类型安全的 IPC 通信
 */
export interface ElectronAPI {
  /**
   * 发送消息到主进程
   * @param message - 用户消息
   * @returns 操作结果
   */
  sendMessage: (message: string) => Promise<{ success?: boolean; error?: string }>;
  
  /**
   * 监听 AI 流式输出
   * @param callback - 接收文本增量的回调
   */
  onAIDelta: (callback: (event: unknown, delta: string) => void) => void;
  
  /**
   * 移除 AI 流式输出监听器
   */
  removeAIDeltaListener: () => void;
}

/**
 * 扩展 Window 接口，添加 electronAPI
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
