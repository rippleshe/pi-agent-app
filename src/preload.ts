/**
 * Electron 预加载脚本 (Preload Script)
 *
 * 【这个文件的角色：安全桥梁】
 *
 * 主进程 (electron-main.ts) 有全部权限（读文件、访问 API Key...）
 * 渲染进程 (renderer/) 只能显示 UI，不能直接访问敏感资源
 *
 * preload.ts 在两者之间建了一座"窄桥"：
 * - 只暴露必要的方法（最小权限原则）
 * - 渲染进程通过 window.electronAPI.xxx() 调用这些方法
 * - 渲染进程无法绕过这座桥去访问其他东西
 *
 * 【contextBridge.exposeInMainWorld 做了什么？】
 * 它把一个对象挂载到渲染进程的 window 对象上。
 * 比如 exposeInMainWorld('electronAPI', { sendMessage: ... })
 * 渲染进程就可以用 window.electronAPI.sendMessage(...) 来调用。
 *
 * 【为什么不直接挂载到 window 上？】
 * 因为 contextIsolation: true（我们在 electron-main.ts 中设置了），
 * preload 脚本和渲染进程的 JavaScript 运行在不同的"上下文"中。
 * contextBridge 是唯一的、安全的桥接方式。
 *
 * 【ipcRenderer.invoke vs ipcRenderer.on】
 * - invoke: 渲染进程 → 主进程（请求-响应模式，返回 Promise）
 * - on:     主进程 → 渲染进程（事件订阅模式，主进程主动推送）
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * 把 API 暴露到渲染进程的 window.electronAPI 上
 *
 * 【对象方法的简写语法】
 * { sendMessage(message) { ... } }
 * 等价于
 * { sendMessage: function(message) { ... } }
 * 更简洁，ES6 的语法糖。
 */
contextBridge.exposeInMainWorld('electronAPI', {

  // ═══════════════════════════════════════════════════════════════════
  // 消息通道（渲染进程 → 主进程）
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 发送用户消息给 AI
   *
   * 渲染进程调用：const result = await window.electronAPI.sendMessage("你好")
   *
   * ipcRenderer.invoke 会：
   * 1. 把 message 通过 IPC 发送给主进程
   * 2. 主进程的 ipcMain.handle('send-message', ...) 会被触发
   * 3. handler 的返回值会作为这个 Promise 的结果
   *
   * 所以整个过程是：渲染进程发出请求 → 主进程处理 → 返回结果
   */
  sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),

  // ═══════════════════════════════════════════════════════════════════
  // AI 事件监听（主进程 → 渲染进程）
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 监听 AI 流式文本增量
   *
   * 【回调函数模式】
   * 传入一个函数(callback)，当事件发生时，这个函数会被调用。
   * 这是 JavaScript 中最常见的异步模式之一。
   *
   * ipcRenderer.on('ai-stream-delta', (event, delta) => ...)
   * - 'ai-stream-delta': 事件频道名，必须和主进程 send() 的频道名一致
   * - event: Electron 内部事件对象（我们不需要，用 _event 忽略）
   * - delta: 主进程 send() 传来的数据（AI 输出的几个字符）
   *
   * 我们只把 delta 传给 callback，隐藏了 event 这个内部细节。
   */
  onAIDelta: (callback: (delta: string) => void) => {
    ipcRenderer.on('ai-stream-delta', (_event, delta) => callback(delta));
  },

  /**
   * 监听 AI 一轮回答完成
   *
   * callback 没有参数（void），因为完成事件只需要"通知"，不需要额外数据。
   */
  onAIStreamEnd: (callback: () => void) => {
    ipcRenderer.on('ai-stream-end', () => callback());
  },

  /** 监听 AI 初始化成功 */
  onAIInitSuccess: (callback: () => void) => {
    ipcRenderer.on('ai-init-success', () => callback());
  },

  /** 监听 AI 初始化失败，附带错误信息 */
  onAIInitError: (callback: (message: string) => void) => {
    ipcRenderer.on('ai-init-error', (_event, message) => callback(message));
  },

  /**
   * 清理所有 AI 事件监听器
   *
   * 【为什么需要清理？】
   * 每次调用 onAIDelta()，都会注册一个新的监听器。
   * 如果组件卸载时不清理，监听器会越积越多（内存泄漏）。
   * removeAllListeners 清除指定频道的所有监听器。
   *
   * 在 React 中，通常在 useEffect 的返回函数中调用：
   *   useEffect(() => {
   *     window.electronAPI.onAIDelta(handler);
   *     return () => window.electronAPI.removeAllAIListeners(); // 清理
   *   }, []);
   */
  removeAllAIListeners: () => {
    ipcRenderer.removeAllListeners('ai-stream-delta');
    ipcRenderer.removeAllListeners('ai-stream-end');
    ipcRenderer.removeAllListeners('ai-init-success');
    ipcRenderer.removeAllListeners('ai-init-error');
  },

  // ═══════════════════════════════════════════════════════════════════
  // 窗口控制（渲染进程 → 主进程）
  // ═══════════════════════════════════════════════════════════════════

  // 这些都是简单的 invoke 调用，渲染进程通过标题栏按钮触发

  /** 最小化窗口 */
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),

  /** 最大化/还原窗口 */
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),

  /** 关闭窗口 */
  windowClose: () => ipcRenderer.invoke('window-close'),

  /**
   * 查询窗口是否最大化
   *
   * 返回 Promise<boolean>。
   * 因为 invoke 是异步的（要等主进程回复），所以返回 Promise。
   * 使用：const isMax = await window.electronAPI.windowIsMaximized();
   */
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // ═══════════════════════════════════════════════════════════════════
  // 工具配置（双向通信）
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 【类型断言 as 的使用】
   * ipcRenderer.invoke 的返回类型默认是 unknown。
   * 我们用 as Promise<string[]> 告诉 TypeScript 返回值的具体类型。
   * 这样调用方就知道返回的是字符串数组，有代码补全和类型检查。
   */
  getTools: () => ipcRenderer.invoke('get-tools') as Promise<string[]>,

  /**
   * 更新工具列表
   *
   * 传入启用的工具 ID 列表，主进程会重建 AI 会话。
   * 因为重建是异步的，所以返回 Promise。
   */
  setTools: (tools: string[]) => ipcRenderer.invoke('set-tools', tools) as Promise<{ success: boolean }>,

  /** 查询 AI 是否已初始化 */
  getInitStatus: () => ipcRenderer.invoke('get-init-status') as Promise<{ initialized: boolean }>,
});
