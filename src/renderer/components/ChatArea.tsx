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
  const [isFocused, setIsFocused] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    return () => cancelAnimationFrame(raf);
  }, [messages, streamingContent]);

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

  const isEmpty = messages.length <= 1 && !streamingContent;
  const canSend = !!input.trim() && !isWaiting && aiStatus === 'ready';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-0">

      {/* ── Header: minimal chrome (AI-Native UI) ── */}
      <header className="flex items-center gap-3 px-6 h-14 bg-white border-b border-slate-200">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-900">AI 编码助手</h1>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              aiStatus === 'loading' && 'bg-amber-400 animate-pulse',
              aiStatus === 'ready' && (isWaiting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'),
              aiStatus === 'error' && 'bg-red-400',
            )} />
            <span className="text-xs text-slate-500">
              {aiStatus === 'loading' && '初始化中...'}
              {aiStatus === 'error' && (aiError || '初始化失败')}
              {aiStatus === 'ready' && (isWaiting ? '思考中...' : 'DeepSeek V4 Flash · 在线')}
            </span>
          </div>
        </div>
      </header>

      {/* ── Messages ── */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-5">

        {isEmpty && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">有什么可以帮你的？</h2>
            <p className="text-sm text-slate-500">读取文件、执行命令、搜索代码、分析项目...</p>
          </motion.div>
        )}

        {aiStatus === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{aiError || '请检查 DEEPSEEK_API_KEY'}</span>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        </AnimatePresence>

        {streamingContent && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-3xl">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words">
                {streamingContent}
              </div>
            </div>
          </motion.div>
        )}

        {isWaiting && !streamingContent && <TypingIndicator />}
      </div>

      {/* ── Input: primary CTA per AI-Native UI ── */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <div className="flex-1">
            <textarea
              ref={textareaRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
              placeholder={aiStatus === 'ready' ? '输入你的问题...' : '等待初始化...'}
              rows={1} disabled={isWaiting || aiStatus !== 'ready'}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm leading-relaxed cursor-text',
                'bg-slate-50 border transition-all duration-200',
                'text-slate-900 placeholder:text-slate-400',
                'focus:outline-none resize-none',
                'min-h-[48px] max-h-[100px]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isFocused
                  ? 'border-emerald-300 bg-white shadow-[0_0_0_3px_rgba(34,197,94,0.1)]'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            />
          </div>
          <motion.button onClick={handleSend} disabled={!canSend}
            whileHover={canSend ? { scale: 1.04 } : {}}
            whileTap={canSend ? { scale: 0.96 } : {}}
            className={cn(
              'flex items-center justify-center w-10 h-[48px] rounded-xl transition-all duration-200 cursor-pointer',
              canSend
                ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:shadow-md'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
            aria-label="发送"
          >
            {isWaiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-center select-none">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
