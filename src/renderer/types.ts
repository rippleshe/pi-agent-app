/**
 * 应用类型定义文件
 *
 * 【为什么要单独建一个 types.ts？】
 * 把所有类型集中在一个文件里，好处是：
 * 1. 其他文件 import 时一眼就知道从哪里找类型
 * 2. 修改类型只需改一个地方，不会漏改
 * 3. 团队协作时，这个文件就是"数据契约"
 *
 * 【TypeScript 核心概念速查】
 * - type: 给一个值起别名，比如 type Age = number
 * - interface: 描述一个对象"长什么样"，有哪些字段、什么类型
 * - export: 把东西暴露出去，其他文件才能 import 使用
 */

// ═══════════════════════════════════════════════════════════════════
// 一、消息相关类型
// ═══════════════════════════════════════════════════════════════════

/**
 * 【联合类型 (Union Type)】
 *
 * 'user' | 'assistant' | 'system' 表示：这个变量只能是这三个字符串之一
 * 比单纯的 string 更安全——如果你不小心写了 'User'（大写 U），
 * TypeScript 会立刻报错，帮你提前发现拼写问题。
 *
 * 用法：const role: MessageRole = 'user';  ✅
 *       const role: MessageRole = 'admin'; ❌ 编译报错
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 【接口 (Interface)】
 *
 * interface 描述一个对象的"形状"——它必须有哪些字段、每个字段是什么类型。
 * 就像一张表格的表头，规定了每一列的名称和数据格式。
 *
 * 用法：
 *   const msg: Message = {
 *     id: '1',
 *     role: 'user',
 *     content: '你好',
 *     timestamp: Date.now(),
 *   };
 *
 * 如果漏写字段（比如忘了 timestamp），TypeScript 会报错。
 * 如果多写了字段（比如加了 foo: 1），也会报错。
 * 这就是"类型安全"——编译器帮你检查数据结构是否正确。
 */
export interface Message {
  /** 唯一标识，用于 React 的 key 属性（后面会讲） */
  id: string;
  /** 谁发的消息 */
  role: MessageRole;
  /** 消息文字内容 */
  content: string;
  /** 发送时间的时间戳（毫秒），Date.now() 返回的就是这种数字 */
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════
// 二、工具配置类型
// ═══════════════════════════════════════════════════════════════════

/**
 * 工具配置：描述 AI 可以使用的一个工具
 *
 * 【为什么用 interface 而不是直接写对象？】
 * 因为我们有 5 个工具，每个的结构完全一样。
 * 定义一次 interface，5 个工具对象都能复用这个"模板"。
 */
export interface ToolConfig {
  id: string;       // 工具 ID，对应 pi SDK 的内置工具名（如 'read', 'bash'）
  name: string;     // 显示给用户的中文名
  enabled: boolean; // 是否启用（true/false）
  icon: string;     // 图标标识，用于在 TOOL_ICONS 映射中查找对应的 Lucide 图标
}

/**
 * 【常量对象 + as const】
 *
 * 这里用 as const 让 TypeScript 把这个数组当作"只读常量"。
 * 好处：
 * 1. 防止意外修改（比如 DEFAULT_TOOLS.push(...) 会报错）
 * 2. TypeScript 能推断出更精确的类型（不只是 string，而是 'read' | 'bash' | ...）
 *
 * 不加 as const 也行，只是少了这层保护。
 */
export const DEFAULT_TOOLS: ToolConfig[] = [
  { id: 'read', name: '读取文件', enabled: true, icon: 'file' },
  { id: 'bash', name: '执行命令', enabled: true, icon: 'terminal' },
  { id: 'grep', name: '搜索代码', enabled: true, icon: 'search' },
  { id: 'find', name: '查找文件', enabled: true, icon: 'folder' },
  { id: 'ls',   name: '列出目录', enabled: true, icon: 'list' },
];

// ═══════════════════════════════════════════════════════════════════
// 三、应用状态类型
// ═══════════════════════════════════════════════════════════════════

/**
 * AI 初始化状态
 *
 * 用字符串字面量联合类型来表达"三态"：
 * - 'loading': 正在启动 AI（刚打开应用）
 * - 'ready':   AI 就绪，可以聊天
 * - 'error':   初始化失败（比如 API Key 错误）
 *
 * 比用 boolean 好——boolean 只能表达两种状态，
 * 如果用 boolean，"加载中"和"出错了"就分不清了。
 */
export type AIInitStatus = 'loading' | 'ready' | 'error';

// ═══════════════════════════════════════════════════════════════════
// 四、Electron IPC 通道类型
// ═══════════════════════════════════════════════════════════════════

/**
 * ElectronAPI 接口
 *
 * 【背景：Electron 的安全架构】
 * Electron 应用有两个世界：
 * - 主进程 (electron-main.ts): 能访问文件系统、API Key 等敏感资源
 * - 渲染进程 (renderer/): 显示 UI，但不能直接访问敏感资源
 *
 * 两者通过 "IPC 通道" 通信。preload.ts 是安全桥梁，
 * 它决定暴露哪些方法给渲染进程。
 *
 * 这个接口就是"合同"——preload 暴露了什么，renderer 就能用什么。
 * 两边必须一致，TypeScript 会帮你检查。
 *
 * 【Promise 是什么？】
 * Promise 代表"一个将来会有结果的操作"。
 * 比如 sendMessage 返回 Promise<{ success?: boolean; error?: string }>，
 * 意思是：调用后不会立刻拿到结果，而是等主进程处理完才返回。
 * 用 await 等待结果：const result = await window.electronAPI.sendMessage("hi");
 */
export interface ElectronAPI {
  // ── 消息 ──────────────────────────────────────────────────────────
  /** 发送用户消息给 AI，返回成功或错误 */
  sendMessage: (message: string) => Promise<{ success?: boolean; error?: string }>;

  // ── AI 事件监听（主进程 → 渲染进程）────────────────────────────────
  // 这些是"订阅"模式：传一个回调函数，主进程有事件时会调用它

  /** AI 输出一个字/几个字时触发（流式） */
  onAIDelta: (callback: (delta: string) => void) => void;
  /** AI 一轮回答完成时触发 */
  onAIStreamEnd: (callback: () => void) => void;
  /** AI 初始化成功时触发 */
  onAIInitSuccess: (callback: () => void) => void;
  /** AI 初始化失败时触发，附带错误信息 */
  onAIInitError: (callback: (message: string) => void) => void;
  /** 清理所有监听器（组件卸载时调用，防止内存泄漏） */
  removeAllAIListeners: () => void;

  // ── 窗口控制 ──────────────────────────────────────────────────────
  /** 最小化窗口 */
  windowMinimize: () => Promise<void>;
  /** 最大化或还原窗口 */
  windowMaximize: () => Promise<void>;
  /** 关闭窗口 */
  windowClose: () => Promise<void>;
  /** 查询窗口是否处于最大化状态 */
  windowIsMaximized: () => Promise<boolean>;

  // ── 工具配置 ──────────────────────────────────────────────────────
  /** 获取当前启用的工具 ID 列表 */
  getTools: () => Promise<string[]>;
  /** 更新工具列表（会触发 AI 会话重建） */
  setTools: (tools: string[]) => Promise<{ success: boolean }>;
  /** 查询 AI 是否已初始化完成 */
  getInitStatus: () => Promise<{ initialized: boolean }>;
}

/**
 * 【declare global：扩展全局类型】
 *
 * 浏览器里有个全局的 window 对象。
 * 但 TypeScript 默认不知道 window 上有 electronAPI（这是 preload 动态加的）。
 * 通过 declare global，我们告诉 TypeScript：
 * "window 上确实有个 electronAPI，它的类型是 ElectronAPI"
 *
 * 这样写 window.electronAPI.sendMessage(...) 就不会报红色波浪线了。
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
