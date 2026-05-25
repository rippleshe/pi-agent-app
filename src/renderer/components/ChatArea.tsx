/**
 * 聊天区域 — 清新典雅风格
 *
 * 设计要点：
 * - 极简顶部状态栏，不抢视觉焦点
 * - 消息区大量留白，呼吸感
 * - 输入框圆润柔和，底部半透明毛玻璃
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

export function ChatArea({ messages, streamingContent, isWaiting, aiStatus, aiError, onSendMessage }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    return () => cancelAnimationFrame(raf);
  }, [messages, streamingContent]);

  // 自适应输入框
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isWaiting) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isWaiting, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const isEmptyChat = messages.length <= 1 && !streamingContent;
  const canSend = !!input.trim() && !isWaiting && aiStatus === 'ready';

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">

      {/* ── 顶部状态栏 ── */}
      <header className="flex items-center gap-3 px-6 h-14 bg-surface/40 backdrop-blur-md border-b border-border/30">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/80 to-primary-dark/80 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-text-primary">AI 编码助手</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              aiStatus === 'loading' && 'bg-warning animate-pulse',
              aiStatus === 'ready' && (isWaiting ? 'bg-warning animate-pulse' : 'bg-success'),
              aiStatus === 'error' && 'bg-error',
            )} />
            <span className="text-[11px] text-text-muted">
              {aiStatus === 'loading' && '初始化中...'}
              {aiStatus === 'error' && (aiError || '初始化失败')}
              {aiStatus === 'ready' && (isWaiting ? '思考中...' : 'DeepSeek V4 Flash')}
            </span>
          </div>
        </div>
      </header>

      {/* ── 消息区 ── */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 space-y-6">

        {/* 空状态 */}
        {isEmptyChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-5"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6 text-primary/60" />
            </motion.div>
            <h2 className="text-base font-medium text-text-primary mb-1.5">
              有什么可以帮你的？
            </h2>
            <p className="text-[13px] text-text-muted max-w-xs leading-relaxed">
              读取文件、执行命令、搜索代码、分析项目结构...
            </p>
          </motion.div>
        )}

        {/* 初始化错误 */}
        {aiStatus === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-4 py-3 bg-error-light/50 border border-error/10 rounded-xl text-[13px] text-error max-w-xl mx-auto"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{aiError || '请检查 DEEPSEEK_API_KEY'}</span>
          </motion.div>
        )}

        {/* 消息列表 */}
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        </AnimatePresence>

        {/* 流式输出 */}
        {streamingContent && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-3xl">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/80 to-primary-dark/80 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 bg-surface rounded-2xl rounded-tl-md px-4 py-3 shadow-xs border border-border/30">
              <div className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                {streamingContent}
              </div>
            </div>
          </motion.div>
        )}

        {isWaiting && !streamingContent && <TypingIndicator />}
      </div>

      {/* ── 输入区 ── */}
      <div className="bg-surface/60 backdrop-blur-xl border-t border-border/30 px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex gap-2.5 items-end max-w-3xl mx-auto">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={aiStatus === 'ready' ? '输入你的问题...' : '等待初始化...'}
              rows={1}
              disabled={isWaiting || aiStatus !== 'ready'}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-[13px] leading-relaxed',
                'bg-background border transition-all duration-200',
                'text-text-primary placeholder:text-text-muted/60',
                'focus:outline-none resize-none',
                'min-h-[40px] max-h-[100px]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isInputFocused
                  ? 'border-primary/40 shadow-[0_0_0_3px_rgba(91,154,139,0.06)]'
                  : 'border-border hover:border-border-hover'
              )}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.04 } : {}}
            whileTap={canSend ? { scale: 0.96 } : {}}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
              canSend
                ? 'bg-primary text-white shadow-sm hover:shadow-md'
                : 'bg-border/40 text-text-muted/40 cursor-not-allowed'
            )}
            aria-label="发送"
          >
            {isWaiting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
        <p className="text-[10px] text-text-muted/50 mt-2 text-center select-none">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
