/**
 * Electron 预加载脚本（Preload Script）
 *
 * 这个文件的作用：
 * 1. 作为主进程和渲染进程之间的"安全桥"
 * 2. 暴露有限的、安全的 API 给前端网页
 * 3. 防止前端直接访问 Node.js 和 Electron API
 *
 * 为什么需要 preload 脚本？
 * - 主进程：可以访问文件系统、API Key 等敏感资源
 * - 渲染进程：显示 UI，但不应该直接访问敏感资源
 * - preload：在两者之间建立安全的通信通道
 *
 * 安全机制：
 * - contextIsolation: true（上下文隔离）
 * - nodeIntegration: false（禁用 Node.js 集成）
 * - 只暴露必要的 API（最小权限原则）
 */

// ─── 1. 导入 Electron 模块 ───────────────────────────────────────
// contextBridge: 用于在预加载脚本和网页之间创建安全的桥梁
// ipcRenderer: 渲染进程的 IPC（进程间通信）工具，用于向主进程发送消息
import { contextBridge, ipcRenderer } from 'electron';

// ─── 2. 暴露安全的 API 给渲染进程 ────────────────────────────────
// contextBridge.exposeInMainWorld 的作用：
// - 将指定的对象挂载到 window 对象上
// - 前端网页可以通过 window.electronAPI 访问这些方法
// - 但网页不能直接访问 Node.js 或 Electron 的其他 API
contextBridge.exposeInMainWorld('electronAPI', {
	/**
	 * 发送消息到主进程
	 *
	 * @param message - 用户输入的消息字符串
	 * @returns Promise，解析为主进程的响应
	 *
	 * 使用示例：
	 * const result = await window.electronAPI.sendMessage("你好");
	 * if (result.success) { console.log("发送成功"); }
	 */
	sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),

	/**
	 * 监听 AI 的流式输出
	 *
	 * @param callback - 回调函数，每当收到 AI 的文本增量时被调用
	 *
	 * 使用示例：
	 * window.electronAPI.onAIDelta((delta) => {
	 *   console.log("收到 AI 输出：", delta);
	 * });
	 *
	 * TypeScript 语法解释：
	 * - (delta: string) => void 是回调函数的类型
	 * - delta: string 表示参数 delta 是字符串
	 * - void 表示函数没有返回值
	 * - ipcRenderer.on 监听来自主进程的事件
	 * - 'ai-stream-delta' 是事件名称（必须和主进程一致）
	 */
	onAIDelta: (callback: (delta: string) => void) => {
		ipcRenderer.on('ai-stream-delta', (event, delta) => callback(delta));
	},

	/**
	 * 移除 AI 流式输出的监听器
	 *
	 * 用于清理资源，防止内存泄漏
	 * 通常在组件卸载或页面关闭时调用
	 */
	removeAIDeltaListener: () => {
		ipcRenderer.removeAllListeners('ai-stream-delta');
	},
});

// ─── 3. 安全说明 ─────────────────────────────────────────────────
// 这个 preload 脚本只暴露了 3 个方法：
// 1. sendMessage - 发送消息
// 2. onAIDelta - 监听 AI 输出
// 3. removeAIDeltaListener - 清理监听器
//
// 这样做的好处：
// - 前端不能直接访问文件系统
// - 前端不能直接读取 API Key
// - 前端只能通过这 3 个方法与主进程通信
// - 符合"最小权限原则"（Principle of Least Privilege）
//
// 如果不使用 preload 脚本：
// - 前端可以 require('fs') 读取任意文件 ❌
// - 前端可以访问 process.env 获取 API Key ❌
// - 非常危险！❌
