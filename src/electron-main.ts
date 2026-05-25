/**
 * Electron 主进程文件
 *
 * 负责：
 * 1. 创建应用窗口
 * 2. 初始化 AI 会话（pi-coding-agent + DeepSeek）
 * 3. 处理 renderer 发来的消息和配置变更
 * 4. 将 AI 流式响应 + 生命周期事件推送到 renderer
 *
 * 架构：主进程(Node.js) ↔ preload(安全桥) ↔ renderer(React UI)
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getModel, registerBuiltInApiProviders } from '@earendil-works/pi-ai';
import type { AgentSession } from '@earendil-works/pi-coding-agent';
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
	SessionManager,
} from '@earendil-works/pi-coding-agent';

// ─── ES 模块路径兼容 ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 加载 .env ────────────────────────────────────────────────────
dotenv.config();

// ─── 全局状态 ─────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let session: AgentSession | null = null;

// 当前启用的工具列表（可通过 renderer 动态修改）
let enabledTools: string[] = ['read', 'bash', 'grep', 'find', 'ls'];

/**
 * 向 renderer 发送事件的便捷方法
 */
function sendToRenderer(channel: string, ...args: unknown[]) {
	mainWindow?.webContents.send(channel, ...args);
}

/**
 * 初始化 AI 会话
 *
 * 流程：注册提供商 → 读取 Key → 创建认证 → 查找模型 → 创建会话 → 订阅事件
 * 失败时通过 'ai-init-error' 通知 renderer
 */
async function initAISession() {
	registerBuiltInApiProviders();

	const apiKey = process.env.DEEPSEEK_API_KEY;
	if (!apiKey) {
		const msg = 'Missing DEEPSEEK_API_KEY in .env';
		console.error(msg);
		sendToRenderer('ai-init-error', msg);
		return;
	}

	const authStorage = AuthStorage.create();
	authStorage.setRuntimeApiKey('deepseek', apiKey);

	const modelRegistry = ModelRegistry.create(authStorage);
	const model = getModel('deepseek', 'deepseek-v4-flash');

	if (!model) {
		const msg = 'DeepSeek V4 Flash model not found';
		console.error(msg);
		sendToRenderer('ai-init-error', msg);
		return;
	}

	console.log(`Using model: ${model.provider}/${model.id}`);

	const result = await createAgentSession({
		model,
		thinkingLevel: 'off',
		authStorage,
		modelRegistry,
		sessionManager: SessionManager.inMemory(),
		tools: enabledTools,
	});

	session = result.session;
	console.log('AI session initialized');

	// ── 订阅 AI 事件并转发给 renderer ──────────────────────────────
	session.subscribe((event: unknown) => {
		const e = event as Record<string, unknown>;

		// 文本增量 → 实时推送到 renderer
		if (e.type === 'message_update') {
			const msgEvent = e.assistantMessageEvent as Record<string, unknown> | undefined;
			if (msgEvent?.type === 'text_delta') {
				sendToRenderer('ai-stream-delta', msgEvent.delta);
			}
		}

		// 一轮结束（LLM 响应 + 工具调用完成）→ 通知 renderer 流结束
		if (e.type === 'turn_end') {
			sendToRenderer('ai-stream-end');
		}

		// 工具执行事件 → 可选推送到 renderer（为将来扩展预留）
		if (e.type === 'tool_execution_start') {
			sendToRenderer('ai-tool-start', e.toolName);
		}
		if (e.type === 'tool_execution_end') {
			sendToRenderer('ai-tool-end', e.toolName, e.isError);
		}
	});

	// 通知 renderer 初始化成功
	sendToRenderer('ai-init-success');
}

/**
 * 重新创建会话（工具列表变更时调用）
 */
async function recreateSession() {
	if (session) {
		session.dispose();
		session = null;
	}
	await initAISession();
}

// ─── 窗口创建 ─────────────────────────────────────────────────────
function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		frame: false, // 无边框，由 renderer 自定义标题栏
		backgroundColor: '#f8fafc',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const isDev = !app.isPackaged;

	if (isDev) {
		mainWindow.loadURL('http://localhost:5173');
		// 开发时自动打开 DevTools，生产环境不打开
		// mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// ─── IPC 处理器 ────────────────────────────────────────────────────

/** 发送消息给 AI */
ipcMain.handle('send-message', async (_event, message: string) => {
	if (!session) {
		return { error: 'AI session not initialized' };
	}

	try {
		console.log('Sending message to AI:', message);
		// prompt 是异步的，通过 subscribe 事件流推送结果
		// 这里不 await，让流式输出通过事件通道返回
		session.prompt(message);
		return { success: true };
	} catch (error) {
		console.error('Error sending message:', error);
		sendToRenderer('ai-stream-end');
		return { error: (error as Error).message };
	}
});

/** 窗口控制：最小化 */
ipcMain.handle('window-minimize', () => {
	mainWindow?.minimize();
});

/** 窗口控制：最大化/还原 */
ipcMain.handle('window-maximize', () => {
	if (mainWindow?.isMaximized()) {
		mainWindow.unmaximize();
	} else {
		mainWindow?.maximize();
	}
});

/** 窗口控制：关闭 */
ipcMain.handle('window-close', () => {
	mainWindow?.close();
});

/** 获取当前窗口是否最大化（用于标题栏按钮状态） */
ipcMain.handle('window-is-maximized', () => {
	return mainWindow?.isMaximized() ?? false;
});

/** 获取当前启用的工具列表 */
ipcMain.handle('get-tools', () => {
	return enabledTools;
});

/** 更新工具列表（触发会话重建） */
ipcMain.handle('set-tools', async (_event, tools: string[]) => {
	enabledTools = tools;
	console.log('Tools updated:', enabledTools);
	// 工具列表是创建会话时绑定的，变更需要重建会话
	await recreateSession();
	return { success: true };
});

/** 获取初始化状态 */
ipcMain.handle('get-init-status', () => {
	return { initialized: session !== null };
});

// ─── 应用生命周期 ──────────────────────────────────────────────────
app.whenReady().then(async () => {
	console.log('Electron app starting...');
	await initAISession();
	createWindow();
});

app.on('window-all-closed', () => {
	if (session) {
		session.dispose();
		session = null;
	}
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
