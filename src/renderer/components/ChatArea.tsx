/**
 * 聊天区域组件
 * 
 * 功能：
 * - 显示消息列表
 * - 流式输出动画
 * - 输入框和发送按钮
 * 
 * UX 改进（基于 UI/UX Pro Max）：
 * - 触摸目标 ≥44×44px
 * - 微交互动画 150-300ms
 * - 明确的焦点状态
 * - 空状态提示
 * - 加载反馈
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatAreaProps {
  /** 消息列表 */
  messages: Message[];
  /** 当前流式内容 */
  streamingContent: string;
  /** 是否正在等待响应 */
  isWaiting: boolean;
  /** 发送消息回调 */
  onSendMessage: (content: string) => void;
}

/**
 * 欢迎消息动画
 */
const welcomeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export function ChatArea({
  messages,
  streamingContent,
  isWaiting,
  onSendMessage,
}: ChatAreaProps) {
  // 输入框内容
  const [input, setInput] = useState('');
  
  // 聊天容器引用，用于自动滚动
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 文本框引用，用于自动调整高度
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 输入框焦点状态
  const [isInputFocused, setIsInputFocused] = useState(false);

  /**
   * 自动滚动到底部
   * 使用 requestAnimationFrame 确保 DOM 更新后滚动
   */
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const raf = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, streamingContent]);

  /**
   * 自动调整文本框高度
   * 限制最大高度为 120px
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  /**
   * 处理发送
   */
  const handleSend = useCallback(() => {
    if (!input.trim() || isWaiting) return;
    onSendMessage(input.trim());
    setInput('');
  }, [input, isWaiting, onSendMessage]);

  /**
   * 处理键盘事件
   * Enter 发送，Shift+Enter 换行
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // 是否为空对话
  const isEmptyChat = messages.length <= 1 && !streamingContent;

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* ── 顶部状态栏 ── */}
      <header className="flex items-center gap-3 px-5 py-3 bg-surface/80 backdrop-blur-xl border-b border-border">
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-text-primary truncate">
            AI 编码助手
          </h1>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'inline-block w-1.5 h-1.5 rounded-full',
              isWaiting ? 'bg-warning animate-pulse' : 'bg-success'
            )} />
            <span className="text-xs text-text-secondary">
              {isWaiting ? '正在思考...' : 'DeepSeek V4 Flash 在线'}
            </span>
          </div>
        </div>
      </header>

      {/* ── 消息列表区域 ── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6"
      >
        {/* 空状态欢迎 */}
        {isEmptyChat && (
          <motion.div
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center mb-4"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
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

        {/* 历史消息 */}
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* 流式输出消息 */}
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

        {/* 打字指示器 */}
        {isWaiting && !streamingContent && <TypingIndicator />}
      </div>

      {/* ── 输入区域 ── */}
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
              placeholder="输入你的问题..."
              rows={1}
              disabled={isWaiting}
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
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isWaiting}
            whileHover={input.trim() && !isWaiting ? { scale: 1.02 } : {}}
            whileTap={input.trim() && !isWaiting ? { scale: 0.98 } : {}}
            className={cn(
              'flex items-center justify-center gap-2',
              'px-4 py-3 rounded-xl font-medium text-sm',
              'min-h-[44px] min-w-[44px]',
              'transition-all duration-200',
              input.trim() && !isWaiting
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg active:shadow-sm'
                : 'bg-background text-text-muted cursor-not-allowed opacity-50'
            )}
            aria-label={isWaiting ? '正在等待响应' : '发送消息'}
          >
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
