/**
 * 根组件 — App
 *
 * 【React 组件是什么？】
 * 组件就是一个函数，接受"属性"(props)，返回"JSX"（长得像 HTML 的东西）。
 * App 是整棵组件树的根，它管理全局状态，把数据传给子组件。
 *
 * 【这个组件的职责】
 * 1. 管理全局状态（消息列表、AI 状态、工具配置等）
 * 2. 监听主进程的 IPC 事件（AI 输出、生命周期）
 * 3. 把数据和回调函数通过 props 传给子组件
 *
 * 【数据流方向：单向数据流】
 * React 的核心思想：数据自上而下流动（父 → 子），通过 props 传递。
 * 子组件要修改数据？不能直接改，而是调用父组件传来的回调函数。
 * 这样数据的流向是可预测的，容易调试。
 *
 *   App (状态) ──props──→ ChatArea (显示)
 *      ↑                      │
 *      └─────callback──────────┘ (用户发送消息)
 */

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { TitleBar } from './components/TitleBar';
import { Message, ToolConfig, AIInitStatus, DEFAULT_TOOLS } from './types';

// ═══════════════════════════════════════════════════════════════════
// 欢迎消息常量
// ═══════════════════════════════════════════════════════════════════

/**
 * 【const 放在组件外面】
 * 因为 WELCOME_MESSAGE 不会变化，放在组件外面避免每次渲染都重新创建。
 * 如果放在组件里面，每次 App 重新渲染都会创建一个新对象（浪费内存）。
 */
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是你的 AI 编码助手。我可以帮助你读取文件、执行命令、搜索代码等。有什么可以帮你的吗？',
  timestamp: Date.now(),
};

// ═══════════════════════════════════════════════════════════════════
// 根组件
// ═══════════════════════════════════════════════════════════════════

/**
 * 【export default 是什么？】
 * 一个文件只能有一个 default export。
 * 其他文件 import 时可以随便起名字：import App from './App'
 * 而命名 export（export function xxx）需要花括号：import { xxx } from '...'
 */
export default function App() {

  // ── useState Hook：管理组件状态 ──────────────────────────────────
  //
  // 【useState 是什么？】
  // useState 是 React 最核心的 Hook。Hook 是"钩子"，让你在函数组件中使用状态。
  //
  // 语法：const [值, 修改函数] = useState(初始值)
  //
  // 比如：const [count, setCount] = useState(0)
  // - count 是当前值（初始为 0）
  // - setCount 是修改函数（调用后 React 会重新渲染组件）
  // - [count, setCount] 是数组解构赋值
  //
  // 【重要：状态更新是异步的】
  // setCount(1) 不会立刻改变 count 的值。
  // React 会"批处理"状态更新，在下一次渲染时才生效。
  // 所以不要在 setCount 后面立刻读 count，读到的还是旧值。
  //
  // ─────────────────────────────────────────────────────────────────

  /** 消息列表（初始有一条欢迎消息） */
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  //                                    ^^^^^^^^^^^^^^
  //                                    泛型语法：告诉 useState 数组元素的类型是 Message

  /** 当前正在流式接收的 AI 输出（还没形成完整消息） */
  const [streamingContent, setStreamingContent] = useState('');

  /** 是否正在等待 AI 响应 */
  const [isWaiting, setIsWaiting] = useState(false);

  /** 侧边栏是否折叠 */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /** 设置面板是否打开 */
  const [settingsOpen, setSettingsOpen] = useState(false);

  /** AI 初始化状态 */
  const [aiStatus, setAiStatus] = useState<AIInitStatus>('loading');

  /** AI 初始化错误信息 */
  const [aiError, setAiError] = useState<string | null>(null);

  /** 工具配置列表 */
  const [tools, setTools] = useState<ToolConfig[]>(DEFAULT_TOOLS);

  // ── useEffect Hook：副作用处理 ───────────────────────────────────
  //
  // 【useEffect 是什么？】
  // 组件的"副作用"：不直接产生 UI，但需要做的事情。
  // 比如：订阅事件、发网络请求、操作定时器等。
  //
  // 语法：useEffect(() => { ... 副作用代码 ... }, [依赖数组])
  //
  // 【依赖数组的含义】
  // - []: 空数组 → 只在组件挂载时执行一次（类似"初始化"）
  // - [a, b]: 当 a 或 b 变化时重新执行
  // - 不写: 每次渲染都执行（通常不需要）
  //
  // 【返回函数（清理函数）】
  // useEffect 可以返回一个函数，React 会在组件卸载时调用它。
  // 用来清理副作用（取消订阅、清除定时器等），防止内存泄漏。
  //
  // ─────────────────────────────────────────────────────────────────

  /**
   * 监听主进程的 AI 事件
   *
   * 这个 useEffect 只在组件挂载时执行一次（空依赖 []）。
   * 它注册了 4 个事件监听器，分别处理不同的 AI 生命周期事件。
   */
  useEffect(() => {
    // 开发环境下的安全检查
    if (!window.electronAPI) {
      setAiStatus('error');
      setAiError('Electron API not available');
      return;
    }

    // ── 事件 1: 流式文本增量 ─────────────────────────────────────
    // AI 每输出几个字符就触发一次
    // setStreamingContent(prev => prev + delta) 的含义：
    // - prev 是当前值（即之前的 streamingContent）
    // - 返回新值 = 旧值 + 新增的字符
    // - 这是 useState 的"函数式更新"语法，保证拿到最新的值
    window.electronAPI.onAIDelta((delta: string) => {
      setStreamingContent(prev => prev + delta);
    });

    // ── 事件 2: AI 一轮回答完成 ─────────────────────────────────
    // 这是修复 isWaiting 卡死 bug 的关键！
    window.electronAPI.onAIStreamEnd(() => {
      // 【函数式更新的嵌套使用】
      // 这里同时需要读取 streamingContent 和更新 messages
      // 我们在 setStreamingContent 的回调里调用 setMessages
      // 这样能保证读到最新的 streamingContent 值
      setStreamingContent(prev => {
        if (prev) {
          // 把累积的流式内容组装成一条完整的消息
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,  // 用时间戳生成唯一 ID
            role: 'assistant',
            content: prev,
            timestamp: Date.now(),
          };
          // 【函数式更新 messages】
          // prev => [...prev, newItem] 是向数组末尾添加元素的标准写法
          // 展开运算符 ...prev 复制原有数组，再追加新元素
          setMessages(msgs => [...msgs, aiMessage]);
        }
        return ''; // 清空流式缓冲
      });
      setIsWaiting(false); // 结束等待状态
    });

    // ── 事件 3: AI 初始化成功 ───────────────────────────────────
    window.electronAPI.onAIInitSuccess(() => {
      setAiStatus('ready');
      setAiError(null);
    });

    // ── 事件 4: AI 初始化失败 ───────────────────────────────────
    window.electronAPI.onAIInitError((message: string) => {
      setAiStatus('error');
      setAiError(message);
      setIsWaiting(false);
    });

    // ── 检查当前初始化状态 ───────────────────────────────────────
    // 页面刷新时，AI 可能已经初始化好了，但我们的事件监听还没注册。
    // 所以主动查询一次当前状态。
    window.electronAPI.getInitStatus().then(({ initialized }) => {
      if (initialized) {
        setAiStatus('ready');
      }
    });

    // ── 清理函数 ─────────────────────────────────────────────────
    // 组件卸载时（比如页面关闭），移除所有事件监听器
    return () => {
      window.electronAPI?.removeAllAIListeners();
    };
  }, []); // ← 空数组 = 只执行一次

  // ── useCallback Hook：缓存函数引用 ──────────────────────────────
  //
  // 【为什么要用 useCallback？】
  // 每次组件重新渲染，函数都会重新创建（新的引用）。
  // 如果把函数传给子组件作为 props，子组件也会认为 props 变了而重新渲染。
  // useCallback 会缓存函数，只有依赖变化时才创建新的。
  //
  // 语法：useCallback(函数, [依赖数组])
  //
  // 【依赖数组】
  // 列出函数内部用到的外部变量。
  // 如果依赖没变，useCallback 返回上次缓存的函数。
  // 如果依赖变了，创建新函数。
  //
  // ─────────────────────────────────────────────────────────────────

  /** 发送用户消息 */
  const handleSendMessage = useCallback(async (content: string) => {
    // 前置检查：内容为空、正在等待、AI 未就绪 → 不发送
    if (!content.trim() || isWaiting || aiStatus !== 'ready') return;

    // 添加用户消息到列表
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsWaiting(true);       // 开始等待
    setStreamingContent('');   // 清空上次的流式缓冲

    try {
      // 通过 IPC 发送到主进程
      const result = await window.electronAPI.sendMessage(content.trim());

      if (result.error) {
        // 发送失败，显示错误消息
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `错误：${result.error}`,
          timestamp: Date.now(),
        }]);
        setIsWaiting(false);
      }
      // 成功时不设置 isWaiting = false！
      // 要等主进程发来 'ai-stream-end' 事件才重置
    } catch (error) {
      // 网络错误等异常
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `发送失败：${(error as Error).message}`,
        timestamp: Date.now(),
      }]);
      setIsWaiting(false);
    }
    // 【依赖数组 [isWaiting, aiStatus]】
    // 函数内部用到了 isWaiting 和 aiStatus，所以列在依赖中。
    // 当它们变化时，useCallback 会创建新版本的 handleSendMessage。
  }, [isWaiting, aiStatus]);

  /** 清空对话 */
  const handleClearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setStreamingContent('');
    setIsWaiting(false);
  }, []); // 无依赖，函数永远不变

  /**
   * 切换工具状态
   *
   * 切换后同步到主进程（触发 AI 会话重建）。
   * 注意：setTools 的函数式更新里调用了 IPC，这是允许的。
   */
  const handleToggleTool = useCallback(async (toolId: string) => {
    setTools(prev => {
      // 更新本地状态
      const updated = prev.map(tool =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
        //                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //                          展开运算符：复制 tool 的所有字段，只覆盖 enabled
      );
      // 同步到主进程
      const enabledIds = updated.filter(t => t.enabled).map(t => t.id);
      window.electronAPI?.setTools(enabledIds);
      return updated;
    });
  }, []);

  // ── JSX：渲染 UI ─────────────────────────────────────────────────
  //
  // 【JSX 语法速查】
  // <div className="...">  →  等价于 HTML 的 <div class="...">
  //   为什么用 className 而不是 class？
  //   因为 class 是 JavaScript 的保留字（用来定义类），
  //   所以 React 用 className 代替。
  //
  // {/* 注释 */}  →  JSX 中的注释必须用花括号包裹
  //
  // <Component prop={value} />  →  传递属性给子组件
  //   prop={variable}  →  传递 JS 变量
  //   prop="string"    →  传递字符串
  //
  // {expression}  →  在 JSX 中嵌入 JS 表达式
  //   不能放语句（if/for 等），只能放表达式（能求值的东西）
  //
  // ─────────────────────────────────────────────────────────────────

  return (
    // 最外层容器：纵向排列，占满整个屏幕
    <div className="flex flex-col h-screen w-full overflow-hidden">

      {/* 自定义标题栏（frame: false 需要） */}
      <TitleBar />

      {/* 主内容区：横向排列（侧边栏 + 聊天区） */}
      <div className="flex flex-1 min-h-0">
        {/* 侧边栏：传递状态和回调函数 */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClearChat={handleClearChat}
          onOpenSettings={() => setSettingsOpen(true)}
          tools={tools}
          onToggleTool={handleToggleTool}
        />

        {/* 聊天区：传递消息和 AI 状态 */}
        <ChatArea
          messages={messages}
          streamingContent={streamingContent}
          isWaiting={isWaiting}
          aiStatus={aiStatus}
          aiError={aiError}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* 设置面板：条件渲染（settingsOpen 为 true 时才显示） */}
      {settingsOpen && (
        <SettingsPanel
          tools={tools}
          onToggleTool={handleToggleTool}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
