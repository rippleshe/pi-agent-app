/**
 * Electron 预加载脚本
 *
 * 作为主进程和渲染进程之间的安全桥：
 * - 通过 contextBridge 暴露有限 API 给 renderer
 * - 防止 renderer 直接访问 Node.js / Electron 敏感资源
 * - 遵循最小权限原则
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	// ── 消息通道 ────────────────────────────────────────────────────

	/** 发送用户消息到主进程 AI */
	sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),

	// ── AI 生命周期事件（main → renderer）────────────────────────────

	/** 监听 AI 流式文本增量 */
	onAIDelta: (callback: (delta: string) => void) => {
		ipcRenderer.on('ai-stream-delta', (_event, delta) => callback(delta));
	},

	/** 监听 AI 流式输出结束（一轮 LLM 响应完成） */
	onAIStreamEnd: (callback: () => void) => {
		ipcRenderer.on('ai-stream-end', () => callback());
	},

	/** 监听 AI 初始化成功 */
	onAIInitSuccess: (callback: () => void) => {
		ipcRenderer.on('ai-init-success', () => callback());
	},

	/** 监听 AI 初始化失败 */
	onAIInitError: (callback: (message: string) => void) => {
		ipcRenderer.on('ai-init-error', (_event, message) => callback(message));
	},

	/** 移除所有 AI 事件监听器（组件卸载时调用，防止内存泄漏） */
	removeAllAIListeners: () => {
		ipcRenderer.removeAllListeners('ai-stream-delta');
		ipcRenderer.removeAllListeners('ai-stream-end');
		ipcRenderer.removeAllListeners('ai-init-success');
		ipcRenderer.removeAllListeners('ai-init-error');
	},

	// ── 窗口控制（renderer → main）──────────────────────────────────

	/** 最小化窗口 */
	windowMinimize: () => ipcRenderer.invoke('window-minimize'),

	/** 最大化/还原窗口 */
	windowMaximize: () => ipcRenderer.invoke('window-maximize'),

	/** 关闭窗口 */
	windowClose: () => ipcRenderer.invoke('window-close'),

	/** 获取窗口是否处于最大化状态 */
	windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

	// ── 工具配置（renderer ↔ main）──────────────────────────────────

	/** 获取当前启用的工具列表 */
	getTools: () => ipcRenderer.invoke('get-tools') as Promise<string[]>,

	/** 更新工具列表（会重建 AI 会话） */
	setTools: (tools: string[]) => ipcRenderer.invoke('set-tools', tools) as Promise<{ success: boolean }>,

	/** 获取 AI 是否已初始化 */
	getInitStatus: () => ipcRenderer.invoke('get-init-status') as Promise<{ initialized: boolean }>,
});
