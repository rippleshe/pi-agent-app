/**
 * Electron 主进程文件
 *
 * 这是 Electron 应用的入口点，负责：
 * 1. 创建应用窗口
 * 2. 初始化 AI 会话（使用 pi-coding-agent）
 * 3. 处理前端发来的消息
 * 4. 将 AI 的流式响应推送到前端
 *
 * 架构说明：
 * - 主进程（这个文件）：运行在 Node.js 环境，可以访问文件系统和外部 API
 * - 渲染进程（index.html）：运行在 Chromium 浏览器环境，显示 UI
 * - preload 脚本：安全桥接两者
 */

// ─── 1. 导入 Electron 模块 ────────────────────────────────────────
// app: 控制应用生命周期（启动、退出等）
// BrowserWindow: 创建和管理浏览器窗口
// ipcMain: 主进程的进程间通信（Inter-Process Communication）
// 用于处理渲染进程发来的消息
import { app, BrowserWindow, ipcMain } from 'electron';

// path: Node.js 内置模块，处理文件路径
import path from 'path';

// fileURLToPath: 将 URL 转换为文件路径
// 因为 ES 模块使用 URL，而 Electron 需要文件路径
import { fileURLToPath } from 'url';

// dotenv: 加载 .env 文件中的环境变量
import dotenv from 'dotenv';

// ─── 2. 导入 pi AI 和编码代理模块 ─────────────────────────────────
// registerBuiltInApiProviders: 注册所有内置 AI 提供商（DeepSeek、OpenAI 等）
// getModel: 根据提供商和模型 ID 获取模型定义
import { getModel, registerBuiltInApiProviders } from '@earendil-works/pi-ai';

// AuthStorage: 管理 API Key 的存储
// createAgentSession: 创建 AI 代理会话
// ModelRegistry: 模型注册表
// SessionManager: 会话管理器（控制会话持久化方式）
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
	SessionManager,
} from '@earendil-works/pi-coding-agent';

// ─── 3. 处理 ES 模块的路径问题 ────────────────────────────────────
// TypeScript 语法解释：
// import.meta.url 是 ES 模块的语法，表示当前模块的 URL
// fileURLToPath 将 URL 转换为文件系统路径
// 例如：file:///d:/Code/.../electron-main.ts → d:\Code\...\electron-main.ts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 4. 加载环境变量 ─────────────────────────────────────────────
// 从项目根目录的 .env 文件读取环境变量
// 这样我们可以访问 process.env.DEEPSEEK_API_KEY
dotenv.config();

// ─── 5. 定义全局变量 ─────────────────────────────────────────────
// TypeScript 语法解释：
// BrowserWindow | null 是联合类型，表示可以是 BrowserWindow 对象或 null
// 这比 any 更安全，TypeScript 会检查类型
let mainWindow: BrowserWindow | null = null;

// any 表示任意类型（不推荐，但这里为了简化）
// 更好的做法是定义 session 的具体类型
let session: any = null;

/**
 * 初始化 AI 会话
 *
 * 这个函数：
 * 1. 注册 AI 提供商
 * 2. 读取 API Key
 * 3. 创建认证存储
 * 4. 查找并配置 DeepSeek 模型
 * 5. 创建代理会话
 * 6. 订阅 AI 的流式输出事件
 */
async function initAISession() {
	// 注册所有内置的 AI 提供商（必须在 getModel 之前调用）
	registerBuiltInApiProviders();

	// 从环境变量读取 DeepSeek API Key
	const apiKey = process.env.DEEPSEEK_API_KEY;

	// 如果没有 API Key，输出错误并返回
	if (!apiKey) {
		console.error('Missing DEEPSEEK_API_KEY in .env');
		return;
	}

	// 创建认证存储对象
	// AuthStorage.create() 默认读取 ~/.pi/agent/auth.json
	const authStorage = AuthStorage.create();

	// 设置运行时 API Key（不会写入磁盘，仅本次运行有效）
	authStorage.setRuntimeApiKey('deepseek', apiKey);

	// 创建模型注册表
	// 用于查找和管理可用的 AI 模型
	const modelRegistry = ModelRegistry.create(authStorage);

	// 获取 DeepSeek V4 Flash 模型
	// 参数：提供商 ID, 模型 ID
	const model = getModel('deepseek', 'deepseek-v4-flash');

	// 如果模型不存在，输出错误并返回
	if (!model) {
		console.error('DeepSeek model not found');
		return;
	}

	// 输出使用的模型信息
	console.log(`Using model: ${model.provider}/${model.id}`);

	// 创建 AI 代理会话
	// createAgentSession 返回一个 Promise，所以用 await 等待
	const { session: newSession } = await createAgentSession({
		model, // 使用的 AI 模型
		thinkingLevel: 'off', // 思考级别：off 表示不显示思考过程
		authStorage, // 认证存储
		modelRegistry, // 模型注册表
		sessionManager: SessionManager.inMemory(), // 会话存储在内存中（不持久化）
		tools: ['read', 'bash', 'grep', 'find', 'ls'], // AI 可用的工具
	});

	// 保存会话到全局变量
	session = newSession;
	console.log('AI session initialized');

	// ─── 6. 订阅 AI 的流式输出事件 ─────────────────────────────────
	// subscribe 接收一个回调函数，每当有事件发生时会被调用
	// event 参数包含事件的详细信息
	session.subscribe((event: any) => {
		// TypeScript 语法解释：
		// event.type === 'message_update' 检查事件类型
		// && 是逻辑与运算符，表示两个条件都要满足

		// 检查是否是消息更新事件，并且是文本增量
		if (
			event.type === 'message_update' &&
			event.assistantMessageEvent.type === 'text_delta'
		) {
			// TypeScript 语法解释：
			// mainWindow?.webContents.send 是可选链操作符
			// 如果 mainWindow 为 null，不会报错，直接跳过

			// 将流式内容发送到前端界面
			// 'ai-stream-delta' 是事件名称
			// event.assistantMessageEvent.delta 是实际的文本增量（一个字或几个字）
			mainWindow?.webContents.send('ai-stream-delta', event.assistantMessageEvent.delta);
		}
	});
}

/**
 * 创建应用窗口
 *
 * 使用 BrowserWindow 创建一个 1400x900 的窗口
 * 并配置安全选项
 */
function createWindow() {
	// 创建新的浏览器窗口
	mainWindow = new BrowserWindow({
		width: 1400, // 窗口宽度（像素）
		height: 900, // 窗口高度（像素）
		frame: false, // 无边框窗口，自定义标题栏
		backgroundColor: '#f8fafc', // 背景色

		// webPreferences 配置网页的安全和功能选项
		webPreferences: {
			// preload: 预加载脚本的路径
			// 这个脚本会在网页加载前运行，用于暴露安全的 API
			preload: path.join(__dirname, 'preload.js'),

			// contextIsolation: true 启用上下文隔离
			// 这是安全选项，防止网页直接访问 Node.js API
			contextIsolation: true,

			// nodeIntegration: false 禁用 Node.js 集成
			// 这也是安全选项，网页不能直接 require('electron') 等
			nodeIntegration: false,
		},
	});

	// 判断是否为开发模式
	const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

	if (isDev) {
		// 开发模式：加载 Vite 开发服务器
		mainWindow.loadURL('http://localhost:5173');
		// 打开开发者工具
		mainWindow.webContents.openDevTools();
	} else {
		// 生产模式：加载构建后的 HTML 文件
		mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
	}

	// 监听窗口关闭事件
	// 当用户关闭窗口时，将 mainWindow 设为 null
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// ─── 7. 处理前端发来的消息 ───────────────────────────────────────
// ipcMain.handle 注册一个 IPC 处理器
// 当渲染进程调用 ipcRenderer.invoke('send-message', message) 时，这个函数会被调用
ipcMain.handle('send-message', async (event, message: string) => {
	// TypeScript 语法解释：
	// message: string 表示 message 参数的类型是 string
	// 这是 TypeScript 的类型注解，帮助开发者理解参数类型

	// 检查 session 是否已初始化
	if (!session) {
		return { error: 'AI session not initialized' };
	}

	try {
		// 输出日志，方便调试
		console.log('Sending message to AI:', message);

		// 发送消息给 AI
		// 注意：这里没有用 await，因为我们通过流式接收结果
		// session.prompt 返回一个 Promise，但我们不等待它完成
		session.prompt(message);

		// 立即返回成功
		return { success: true };
	} catch (error) {
		// 捕获错误并输出日志
		console.error('Error sending message:', error);

		// TypeScript 语法解释：
		// (error as Error).message 是类型断言
		// error 默认是 unknown 类型，不能直接访问 .message
		// as Error 告诉 TypeScript "这是一个 Error 对象"
		return { error: (error as Error).message };
	}
});

// ─── 8. 应用生命周期管理 ────────────────────────────────────────
// app.whenReady() 返回一个 Promise
// 当 Electron 完成初始化时，执行回调函数
app.whenReady().then(async () => {
	console.log('Electron app starting...');

	// 先初始化 AI 会话
	await initAISession();

	// 然后创建窗口
	createWindow();
});

// 当所有窗口都关闭时
app.on('window-all-closed', () => {
	// 如果有 session，释放资源
	if (session) {
		session.dispose();
	}

	// TypeScript 语法解释：
	// process.platform 返回当前操作系统
	// 'darwin' 是 macOS 的内部名称
	// !== 是不等于运算符

	// 在 Windows 和 Linux 上，关闭窗口就退出应用
	// 在 macOS 上，通常保持应用运行（菜单栏还在）
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// 当应用被激活时（macOS 特有）
app.on('activate', () => {
	// 如果没有窗口，重新创建一个
	// BrowserWindow.getAllWindows() 返回所有窗口数组
	// .length === 0 表示没有窗口
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
