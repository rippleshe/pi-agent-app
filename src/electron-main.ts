/**
 * Electron 主进程文件
 *
 * 【Electron 应用的架构：三个世界】
 *
 * 1. 主进程 (这个文件)
 *    - 运行在 Node.js 环境中
 *    - 能访问文件系统、环境变量、网络等所有系统资源
 *    - 负责创建窗口、管理应用生命周期
 *    - 只能有一个主进程
 *
 * 2. 渲染进程 (renderer/ 目录)
 *    - 运行在 Chromium 浏览器环境中
 *    - 负责显示 UI（我们用 React）
 *    - 不能直接访问文件系统等敏感资源
 *    - 每个窗口一个渲染进程
 *
 * 3. 预加载脚本 (preload.ts)
 *    - 在渲染进程加载网页之前运行
 *    - 作为主进程和渲染进程之间的"安全桥梁"
 *    - 决定暴露哪些 API 给渲染进程
 *
 * 通信方式：IPC (Inter-Process Communication，进程间通信)
 * - ipcMain.handle('频道名', 处理函数)  → 主进程注册处理器
 * - ipcRenderer.invoke('频道名', 参数)  → 渲染进程调用
 * - mainWindow.webContents.send('频道名', 数据) → 主进程主动推送
 */

// ═══════════════════════════════════════════════════════════════════
// 一、导入模块
// ═══════════════════════════════════════════════════════════════════

// ── Electron 核心模块 ──────────────────────────────────────────────
// app: 控制应用生命周期（启动、退出、窗口全部关闭等事件）
// BrowserWindow: 创建和管理浏览器窗口
// ipcMain: 主进程端的 IPC 工具，用于注册"处理器"来响应渲染进程的请求
import { app, BrowserWindow, ipcMain } from 'electron';

// ── Node.js 内置模块 ───────────────────────────────────────────────
// path: 处理文件路径（拼接、解析等），Node.js 内置，不需要安装
import path from 'path';

// ── ES 模块兼容 ────────────────────────────────────────────────────
// 【为什么要 fileURLToPath？】
// ES 模块中 import.meta.url 返回当前文件的 URL（如 file:///d:/Code/.../main.ts）
// 但 Electron/Node.js 需要文件系统路径（如 d:\Code\...\main.ts）
// fileURLToPath 做这个转换
// 【__filename 和 __dirname 在 ES 模块中不存在】
// 在 CommonJS 中它们是全局的，但在 ES 模块中需要手动构造
import { fileURLToPath } from 'url';

// ── 第三方模块 ─────────────────────────────────────────────────────
// dotenv: 读取 .env 文件中的环境变量（如 DEEPSEEK_API_KEY=sk-xxx）
import dotenv from 'dotenv';

// ── pi AI 模块 ─────────────────────────────────────────────────────
// registerBuiltInApiProviders: 注册所有内置 AI 提供商（约 30+ 个）
// getModel: 根据 provider + modelId 查找模型定义
import { getModel, registerBuiltInApiProviders } from '@earendil-works/pi-ai';

// ── pi 编码代理模块 ────────────────────────────────────────────────
// AgentSession: 会话的类型（用于类型注解，不参与运行）
// AuthStorage: 管理 API Key
// createAgentSession: 创建 AI 代理会话的工厂函数
// ModelRegistry: 模型注册表
// SessionManager: 会话持久化管理
import type { AgentSession } from '@earendil-works/pi-coding-agent';
import {
  AuthStorage,
  createAgentSession,
  ModelRegistry,
  SessionManager,
} from '@earendil-works/pi-coding-agent';

// ═══════════════════════════════════════════════════════════════════
// 二、ES 模块路径兼容
// ═══════════════════════════════════════════════════════════════════

// 把 import.meta.url（file:///d:/...）转成文件系统路径（d:\...）
const __filename = fileURLToPath(import.meta.url);
// path.dirname 取目录部分，去掉文件名
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// 三、加载环境变量
// ═══════════════════════════════════════════════════════════════════

// dotenv.config() 读取项目根目录的 .env 文件
// 之后 process.env.DEEPSEEK_API_KEY 就能拿到值了
dotenv.config();

// ═══════════════════════════════════════════════════════════════════
// 四、全局状态
// ═══════════════════════════════════════════════════════════════════

/**
 * 【类型注解语法】
 * let mainWindow: BrowserWindow | null = null;
 *                 ^^^^^^^^^^^^^^^^^^^^^^^
 *                 这是类型注解，告诉 TypeScript 这个变量的类型
 *
 * BrowserWindow | null 是联合类型：变量可以是 BrowserWindow 对象，也可以是 null
 * 为什么可以是 null？因为窗口关闭后我们会设为 null（见 mainWindow.on('closed')）
 *
 * 如果不写类型注解，TypeScript 也能自动推断，但写出来更清晰。
 */
let mainWindow: BrowserWindow | null = null;

/**
 * 【import type vs import 的区别】
 * import type { AgentSession } 只导入类型信息，编译后会被完全移除。
 * 这样做的好处：
 * 1. 减少打包体积（类型信息不需要出现在运行时代码中）
 * 2. 明确表达意图："我只用它来做类型检查，不会用它的值"
 */
let session: AgentSession | null = null;

/** 当前启用的工具列表，可通过 renderer 动态修改 */
let enabledTools: string[] = ['read', 'bash', 'grep', 'find', 'ls'];

// ═══════════════════════════════════════════════════════════════════
// 五、辅助函数
// ═══════════════════════════════════════════════════════════════════

/**
 * 向渲染进程发送事件
 *
 * 【可选链 ?.】
 * mainWindow?.webContents.send(...)
 * 如果 mainWindow 是 null/undefined，整个表达式直接返回 undefined，不会报错。
 * 等价于：if (mainWindow) { mainWindow.webContents.send(...) }
 * 但写起来简洁多了。
 *
 * 【...args: unknown[]】
 * unknown 是 TypeScript 的安全版 any。
 * unknown[] 表示"任意数量、任意类型的参数"。
 * 比 any 安全的地方：使用 unknown 类型的值之前，必须先做类型检查。
 */
function sendToRenderer(channel: string, ...args: unknown[]) {
  mainWindow?.webContents.send(channel, ...args);
}

// ═══════════════════════════════════════════════════════════════════
// 六、AI 会话初始化
// ═══════════════════════════════════════════════════════════════════

/**
 * 初始化 AI 会话
 *
 * 【async/await 语法】
 * async function 表示这个函数内部会用 await 等待异步操作。
 * await 会"暂停"函数执行，等 Promise 完成后再继续。
 * 就像在餐厅点餐：点了菜（发起请求），等菜做好（await），然后吃（继续执行）。
 *
 * 如果没有 async/await，代码会变成回调地狱：
 *   createAgentSession({...}, (result) => {
 *     session.subscribe((event) => { ... });
 *   });
 * 有了 async/await，代码像同步一样易读。
 */
async function initAISession() {
  // 注册所有内置 AI 提供商（必须在 getModel 之前）
  registerBuiltInApiProviders();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const msg = 'Missing DEEPSEEK_API_KEY in .env';
    console.error(msg);
    // 通知渲染进程：初始化失败了
    sendToRenderer('ai-init-error', msg);
    return; // return 提前退出函数
  }

  // AuthStorage 管理 API Key 的存储
  // create() 默认读取 ~/.pi/agent/auth.json
  const authStorage = AuthStorage.create();

  // setRuntimeApiKey 是"运行时覆盖"，不会写入磁盘
  // 只在本次运行期间有效，适合从 .env 注入密钥
  authStorage.setRuntimeApiKey('deepseek', apiKey);

  // ModelRegistry 把 AuthStorage 和模型列表结合起来
  const modelRegistry = ModelRegistry.create(authStorage);

  // 查找 DeepSeek V4 Flash 模型
  // 参数顺序：provider（提供商 ID），modelId（模型 ID）
  const model = getModel('deepseek', 'deepseek-v4-flash');

  if (!model) {
    const msg = 'DeepSeek V4 Flash model not found';
    console.error(msg);
    sendToRenderer('ai-init-error', msg);
    return;
  }

  console.log(`Using model: ${model.provider}/${model.id}`);

  // 【解构赋值】
  // const { session: newSession } = await createAgentSession({...})
  //       ^^^^^^^^^^^^^^^^^^^^^^^
  // 从返回的对象中取出 session 字段，并重命名为 newSession
  // 为什么要重命名？因为外层已经有一个全局变量叫 session，避免冲突
  const result = await createAgentSession({
    model,                              // 使用的 AI 模型
    thinkingLevel: 'off',               // 不输出思考过程
    authStorage,                        // 认证存储
    modelRegistry,                      // 模型注册表
    sessionManager: SessionManager.inMemory(), // 内存会话（不持久化到磁盘）
    tools: enabledTools,                // AI 可用的工具
  });

  session = result.session;
  console.log('AI session initialized');

  // ── 订阅 AI 事件并转发给渲染进程 ─────────────────────────────────
  // session.subscribe() 注册一个事件监听器
  // 每当 AI 有新的输出（文本、工具调用等），这个回调就会被调用
  session.subscribe((event: unknown) => {
    // 【类型断言 (Type Assertion)】
    // event 的类型是 unknown（最安全的类型），但我们知道它是一个对象
    // as Record<string, unknown> 告诉 TypeScript："把它当作有字符串键的对象"
    // Record<string, unknown> 等价于 { [key: string]: unknown }
    const e = event as Record<string, unknown>;

    // 文本增量事件 → 实时推送到渲染进程
    if (e.type === 'message_update') {
      // assistantMessageEvent 也是一个对象，需要再次断言
      const msgEvent = e.assistantMessageEvent as Record<string, unknown> | undefined;
      if (msgEvent?.type === 'text_delta') {
        // send() 是"主进程主动推送到渲染进程"
        // 渲染进程通过 ipcRenderer.on() 或 preload 的 onAIDelta() 接收
        sendToRenderer('ai-stream-delta', msgEvent.delta);
      }
    }

    // turn_end = 一轮 LLM 响应 + 工具调用全部完成
    // 这是关键事件：告诉渲染进程"这一轮回答结束了"
    if (e.type === 'turn_end') {
      sendToRenderer('ai-stream-end');
    }
  });

  // 通知渲染进程：AI 准备好了
  sendToRenderer('ai-init-success');
}

/**
 * 重建会话（工具列表变更时调用）
 *
 * 为什么要销毁再重建？因为工具列表是创建会话时绑定的，
 * 不能在运行中动态增减工具，所以只能重建。
 */
async function recreateSession() {
  if (session) {
    session.dispose(); // 释放旧会话的资源
    session = null;
  }
  await initAISession();
}

// ═══════════════════════════════════════════════════════════════════
// 七、窗口创建
// ═══════════════════════════════════════════════════════════════════

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    // frame: false → 无边框窗口（没有系统自带的标题栏）
    // 我们用自定义的 TitleBar 组件替代
    frame: false,
    backgroundColor: '#f8fafc',

    webPreferences: {
      // preload: 预加载脚本路径
      // __dirname 是 dist/ 目录，preload.js 是编译后的 preload.ts
      preload: path.join(__dirname, 'preload.js'),

      // contextIsolation: true → 安全选项
      // 渲染进程的全局对象和 preload 脚本的全局对象是隔离的
      // 防止网页 JS 篡改 preload 暴露的 API
      contextIsolation: true,

      // nodeIntegration: false → 安全选项
      // 渲染进程不能直接 require('fs') 等 Node.js 模块
      // 所有 Node.js 功能必须通过 preload 暴露
      nodeIntegration: false,
    },
  });

  // 判断开发模式
  // app.isPackaged = true 表示被打包成了 .exe/.dmg
  // 开发时是 false
  const isDev = !app.isPackaged;

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器（热更新）
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // 生产模式：加载构建后的静态文件
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }

  // 窗口关闭时清理引用
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ═══════════════════════════════════════════════════════════════════
// 八、IPC 处理器（响应渲染进程的请求）
// ═══════════════════════════════════════════════════════════════════

/**
 * 【ipcMain.handle 的工作方式】
 * ipcMain.handle('频道名', async (event, 参数) => { return 结果 })
 *
 * 渲染进程调用：const result = await window.electronAPI.sendMessage("你好")
 * ↓ 触发 ↓
 * 主进程执行这个 handler，return 的值会作为 result 返回给渲染进程
 *
 * event 参数包含发送方的信息（如 event.sender 是发送消息的 webContents）
 * 这里用 _event 表示"我不需要这个参数"，下划线前缀是 TypeScript 的惯例
 */

// 处理用户消息
ipcMain.handle('send-message', async (_event, message: string) => {
  if (!session) {
    return { error: 'AI session not initialized' };
  }

  try {
    console.log('Sending message to AI:', message);
    // 【fire-and-forget 模式】
    // session.prompt() 返回 Promise，但我们不 await 它。
    // 因为 AI 的响应是通过 subscribe 事件流推送的（见上面的 subscribe），
    // 不是通过 prompt 的返回值。所以我们只需要"发出请求"，不用等结果。
    session.prompt(message);
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    // 出错时通知渲染进程：流结束了（避免 UI 卡在等待状态）
    sendToRenderer('ai-stream-end');
    return { error: (error as Error).message };
  }
});

// ── 窗口控制 ───────────────────────────────────────────────────────

/** 最小化窗口 */
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

/** 最大化/还原窗口 */
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize(); // 已最大化 → 还原
  } else {
    mainWindow?.maximize();  // 未最大化 → 最大化
  }
});

/** 关闭窗口 */
ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

/** 查询窗口是否最大化（供标题栏按钮显示正确的图标） */
ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
  // ?? 是空值合并运算符：左边是 null/undefined 时，返回右边的值
});

// ── 工具配置 ───────────────────────────────────────────────────────

/** 获取当前启用的工具列表 */
ipcMain.handle('get-tools', () => {
  return enabledTools;
});

/** 更新工具列表（触发会话重建） */
ipcMain.handle('set-tools', async (_event, tools: string[]) => {
  enabledTools = tools;
  console.log('Tools updated:', enabledTools);
  await recreateSession(); // 工具变了，需要重建会话
  return { success: true };
});

/** 查询 AI 是否已初始化 */
ipcMain.handle('get-init-status', () => {
  return { initialized: session !== null };
});

// ═══════════════════════════════════════════════════════════════════
// 九、应用生命周期
// ═══════════════════════════════════════════════════════════════════

/**
 * 【app.whenReady()】
 * Electron 启动需要一些时间（加载 Chromium 等）。
 * whenReady() 返回 Promise，等 Electron 完全准备好后再执行。
 * 如果在 ready 之前就创建窗口，会失败。
 */
app.whenReady().then(async () => {
  console.log('Electron app starting...');
  // 先初始化 AI，再创建窗口（保证窗口打开时 AI 已就绪）
  await initAISession();
  createWindow();
});

/**
 * 所有窗口关闭时的处理
 *
 * 【为什么 macOS 特殊？】
 * macOS 的惯例是：关闭窗口 ≠ 退出应用。应用还在 Dock 里。
 * 点击 Dock 图标应该重新打开窗口。
 * Windows/Linux 的惯例是：关闭窗口 = 退出应用。
 */
app.on('window-all-closed', () => {
  if (session) {
    session.dispose();
    session = null;
  }
  if (process.platform !== 'darwin') {
    // darwin = macOS
    app.quit();
  }
});

/**
 * macOS 特有：点击 Dock 图标时，如果没有窗口，重新创建一个
 *
 * 【BrowserWindow.getAllWindows()】
 * 返回所有窗口的数组。.length === 0 表示一个窗口都没有。
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
