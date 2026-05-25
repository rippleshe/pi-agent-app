/**
 * 聊天区域组件
 *
 * 包含：顶部状态栏、消息列表、流式输出、输入框
 * UX：自动滚动、自适应输入框高度、Enter 发送 / Shift+Enter 换行
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, AIInitStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatAreaProps {
  messages: Message[];
  streamingContent: string;
  isWaiting: boolean;
  aiStatus: AIInitStatus;
  aiError: string | null;
  onSendMessage: (content: string) => void;
}

export function ChatArea({
  messages,
  streamingContent,
  isWaiting,
  aiStatus,
  aiError,
  onSendMessage,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const raf = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, streamingContent]);

  // 自适应输入框高度（最大 120px）
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isWaiting) return;
    onSendMessage(input.trim());
    setInput('');
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isWaiting, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isEmptyChat = messages.length <= 1 && !streamingContent;
  const canSend = input.trim() && !isWaiting && aiStatus === 'ready';

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

      {/* ── 消息列表 ── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6"
      >
        {/* 空状态欢迎 */}
        {isEmptyChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
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

        {/* 历史消息 */}
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* 流式输出 */}
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
              placeholder={aiStatus === 'ready' ? '输入你的问题...' : '等待 AI 初始化...'}
              rows={1}
              disabled={isWaiting || aiStatus !== 'ready'}
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
