/**
 * 聊天区域组件
 *
 * 【组件的 Props 模式】
 * 这个组件不管理自己的核心数据（消息、AI 状态），
 * 而是通过 props 从父组件 (App) 接收数据。
 *
 * 这叫"受控组件"——组件的显示完全由外部数据控制。
 * 好处：数据只有一个来源（App），不会出现"两个地方的值不一致"的问题。
 *
 * 【interface 定义 Props 类型】
 * 下面的 ChatAreaProps 描述了这个组件接受哪些 props。
 * 父组件传错类型，TypeScript 会报错。
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, AIInitStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

/**
 * Props 类型定义
 *
 * 【为什么要定义 Props 接口？】
 * TypeScript 会检查父组件传入的 props 是否符合这个接口。
 * 比如漏传了 messages，编译时就会报错，而不是运行时白屏。
 */
interface ChatAreaProps {
  messages: Message[];        // 消息列表
  streamingContent: string;   // 当前流式输出内容
  isWaiting: boolean;         // 是否在等待 AI 响应
  aiStatus: AIInitStatus;     // AI 初始化状态
  aiError: string | null;     // AI 错误信息（null 表示无错误）
  onSendMessage: (content: string) => void; // 发送消息的回调
}

export function ChatArea({
  messages,
  streamingContent,
  isWaiting,
  aiStatus,
  aiError,
  onSendMessage,
}: ChatAreaProps) {

  // ── 本地状态（只跟 UI 交互有关，不需要提升到 App）────────────────

  /** 输入框内容 */
  const [input, setInput] = useState('');

  /** 输入框是否聚焦（用于边框高亮） */
  const [isInputFocused, setIsInputFocused] = useState(false);

  // ── Ref：引用 DOM 元素 ──────────────────────────────────────────
  //
  // 【useRef 是什么？】
  // useRef 创建一个"可变的引用对象"，常用于两种场景：
  // 1. 引用 DOM 元素（如 <div ref={myRef}>，之后 myRef.current 就是这个 div）
  // 2. 存储不触发重新渲染的可变值（类似"实例变量"）
  //
  // 这里用于引用 DOM 元素，以便调用原生 API（如 scrollTop）。
  //
  /** 聊天消息容器（用于自动滚动） */
  const chatContainerRef = useRef<HTMLDivElement>(null);
  //                         ^^^^^^^^^^^^^^^^^^^^
  //                         泛型参数：告诉 useRef 这个引用指向什么类型的 DOM 元素
  //                         HTMLDivElement 对应 <div>，可以访问 scrollTop 等属性

  /** 输入框 textarea */
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── 自动滚动到底部 ──────────────────────────────────────────────
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // requestAnimationFrame 确保在 DOM 更新后再滚动
    // 否则新消息还没渲染，滚动位置算不对
    const raf = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      // scrollHeight 是内容总高度，scrollTop 设为它就滚到底了
    });

    // 清理：取消未执行的 rAF
    return () => cancelAnimationFrame(raf);
  }, [messages, streamingContent]); // 消息或流式内容变化时滚动

  // ── 自适应输入框高度 ────────────────────────────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 先重置为 auto（让浏览器重新计算内容高度）
    textarea.style.height = 'auto';
    // 再设为实际内容高度（但不超过 120px）
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]); // 输入内容变化时调整

  // ── 处理发送 ────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!input.trim() || isWaiting) return;
    onSendMessage(input.trim()); // 调用父组件传来的回调
    setInput('');                 // 清空输入框
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isWaiting, onSendMessage]);

  // ── 键盘事件 ────────────────────────────────────────────────────
  /**
   * Enter 发送，Shift+Enter 换行
   *
   * 【preventDefault()】
   * 阻止浏览器的默认行为。textarea 中 Enter 默认是换行，
   * 我们要改成发送，所以需要阻止默认的换行行为。
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── 派生状态 ────────────────────────────────────────────────────
  // 这些值是从已有状态"推导"出来的，不需要单独的 useState
  const isEmptyChat = messages.length <= 1 && !streamingContent;
  const canSend = input.trim() && !isWaiting && aiStatus === 'ready';

  // ── JSX 渲染 ────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">

      {/* ═══ 顶部状态栏 ═══ */}
      <header className="flex items-center gap-3 px-5 py-3 bg-surface/80 backdrop-blur-xl border-b border-border">
        {/* AI 头像图标 */}
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md"
          // 【Framer Motion 动画 props】
          // whileHover: 鼠标悬停时的动画
          // whileTap: 鼠标按下时的动画
          // scale: 缩放倍数（1 = 原始大小）
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-text-primary truncate">
            AI 编码助手
          </h1>
          {/* 状态指示器：小圆点 + 文字 */}
          <div className="flex items-center gap-1.5">
            {/* 动态类名：根据状态显示不同颜色 */}
            <span className={cn(
              'inline-block w-1.5 h-1.5 rounded-full',
              aiStatus === 'loading' && 'bg-warning animate-pulse',
              aiStatus === 'ready' && (isWaiting ? 'bg-warning animate-pulse' : 'bg-success'),
              aiStatus === 'error' && 'bg-error',
            )} />
            <span className="text-xs text-text-secondary">
              {aiStatus === 'loading' && '正在初始化...'}
              {aiStatus === 'error' && `初始化失败：${aiError || '未知错误'}`}
              {aiStatus === 'ready' && (isWaiting ? '正在思考...' : 'DeepSeek V4 Flash 在线')}
            </span>
          </div>
        </div>
      </header>

      {/* ═══ 消息列表区域 ═══ */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6">

        {/* 空状态欢迎画面 */}
        {isEmptyChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            {/* 呼吸动画图标 */}
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              你好！我是你的 AI 编码助手
            </h2>
            <p className="text-sm text-text-secondary max-w-sm">
              我可以帮你读取文件、执行命令、搜索代码、分析项目结构等。试试问我一些问题吧！
            </p>
          </motion.div>
        )}

        {/* AI 初始化错误提示 */}
        {aiStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-error-light border border-error/20 rounded-xl text-sm text-error"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">AI 初始化失败</p>
              <p className="text-error/80 text-xs mt-0.5">
                {aiError || '请检查 .env 中的 DEEPSEEK_API_KEY 是否正确'}
              </p>
            </div>
          </motion.div>
        )}

        {/* 历史消息列表 */}
        {/* 【AnimatePresence + mode="popLayout"】
            Framer Motion 的组件，让列表项在添加/移除时有动画效果。
            mode="popLayout" 让移除的元素从布局流中弹出，不挤压其他元素。 */}
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            // 【key 属性】
            // React 要求列表中的每个元素都有唯一的 key。
            // key 帮助 React 识别哪些元素变了、增了、删了，从而高效更新 DOM。
            // 用 message.id 而不是数组索引（index），因为 id 是稳定的。
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* 正在流式输出的消息 */}
        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
              <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-border/50">
                <div className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {streamingContent}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 打字指示器（等待但还没有流式输出时显示） */}
        {isWaiting && !streamingContent && <TypingIndicator />}
      </div>

      {/* ═══ 输入区域 ═══ */}
      <div className="bg-surface/80 backdrop-blur-xl border-t border-border px-4 py-4 sm:px-6">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={aiStatus === 'ready' ? '输入你的问题...' : '等待 AI 初始化...'}
              rows={1}
              disabled={isWaiting || aiStatus !== 'ready'}
              // 【cn() 动态类名】
              // 根据 isInputFocused 切换边框颜色
              className={cn(
                'w-full px-4 py-3 pr-12',
                'bg-background border-2 rounded-xl',
                'text-text-primary placeholder:text-text-muted',
                'text-sm leading-relaxed',
                'focus:outline-none transition-all duration-200',
                'resize-none',
                'min-h-[44px] max-h-[120px]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isInputFocused
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-border-hover'
              )}
            />
          </div>

          {/* 发送按钮 */}
          <motion.button
            onClick={handleSend}
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.02 } : {}}
            whileTap={canSend ? { scale: 0.98 } : {}}
            className={cn(
              'flex items-center justify-center gap-2',
              'px-4 py-3 rounded-xl font-medium text-sm',
              'min-h-[44px] min-w-[44px]',
              'transition-all duration-200',
              canSend
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg active:shadow-sm'
                : 'bg-background text-text-muted cursor-not-allowed opacity-50'
            )}
            aria-label={isWaiting ? '正在等待响应' : '发送消息'}
          >
            {/* 根据状态切换图标：等待中显示旋转动画，否则显示发送箭头 */}
            {isWaiting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center select-none">
          Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
