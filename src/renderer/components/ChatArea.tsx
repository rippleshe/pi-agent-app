import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle, FileCode, Search, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, AIInitStatus } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  messages: Message[];
  streamingContent: string;
  isWaiting: boolean;
  aiStatus: AIInitStatus;
  aiError: string | null;
  onSendMessage: (content: string) => void;
}

/** 空状态快捷提示 */
const QUICK_PROMPTS = [
  { icon: FileCode, text: '读取并分析项目文件', prompt: '请读取当前目录下的主要文件，分析项目结构' },
  { icon: Search, text: '搜索代码中的关键信息', prompt: '请搜索当前项目中的关键函数和接口' },
  { icon: Terminal, text: '执行 shell 命令', prompt: '请列出当前目录的文件结构' },
];

export function ChatArea({ messages, streamingContent, isWaiting, aiStatus, aiError, onSendMessage }: Props) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
    <div className="flex-1 flex flex-col bg-[#fafafa] min-h-0">

      {/* 顶部栏 */}
      <header className="flex items-center gap-3 px-6 h-12 bg-white border-b border-gray-100">
        <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-white">AI</span>
        </div>
        <h1 className="text-[13px] font-medium text-gray-900">AI 编码助手</h1>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            aiStatus === 'loading' && 'bg-amber-400 animate-pulse',
            aiStatus === 'ready' && (isWaiting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'),
            aiStatus === 'error' && 'bg-red-500',
          )} />
          <span className="text-[11px] text-gray-400">
            {aiStatus === 'loading' && '初始化中...'}
            {aiStatus === 'error' && (aiError || '初始化失败')}
            {aiStatus === 'ready' && (isWaiting ? '思考中...' : 'DeepSeek V4 Flash')}
          </span>
        </div>
      </header>

      {/* 消息区 */}
      <div ref={chatRef} className="flex-1 overflow-y-auto">

        {/* 空状态 */}
        {isEmpty && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-20 px-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">有什么可以帮你的？</h2>
            <p className="text-sm text-gray-500 mb-8">我可以帮你读取文件、搜索代码、执行命令</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              {QUICK_PROMPTS.map(({ icon: I, text, prompt }) => (
                <button key={text} onClick={() => onSendMessage(prompt)}
                  className="flex flex-col items-start gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 text-left cursor-pointer group"
                >
                  <I className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <span className="text-[13px] text-gray-600 group-hover:text-gray-900 transition-colors">{text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 错误提示 */}
        {aiStatus === 'error' && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-[13px] text-red-600 max-w-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{aiError || '请检查 DEEPSEEK_API_KEY'}</span>
          </div>
        )}

        {/* 消息列表 */}
        <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.filter(m => m.id !== 'welcome').map(msg => <MessageBubble key={msg.id} message={msg} />)}
          </AnimatePresence>

          {/* 流式输出 */}
          {streamingContent && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-white">AI</span>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                  {streamingContent}
                </div>
              </div>
            </motion.div>
          )}

          {isWaiting && !streamingContent && <TypingIndicator />}
        </div>
      </div>

      {/* 输入区 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea ref={textareaRef} value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder={aiStatus === 'ready' ? '输入你的问题...' : '等待初始化...'}
            rows={1} disabled={isWaiting || aiStatus !== 'ready'}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl text-[14px] leading-relaxed resize-none cursor-text',
              'bg-gray-50 border transition-all duration-200',
              'text-gray-900 placeholder:text-gray-400',
              'focus:outline-none',
              'min-h-[48px] max-h-[120px]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              focused
                ? 'border-gray-900 bg-white shadow-[0_0_0_1px_rgba(9,9,11,0.08)]'
                : 'border-gray-200 hover:border-gray-300'
            )}
          />
          <button onClick={handleSend} disabled={!canSend}
            className={cn(
              'flex items-center justify-center w-10 h-[48px] rounded-xl transition-all duration-200 cursor-pointer',
              canSend
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
            aria-label="发送"
          >
            {isWaiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-gray-300 mt-2.5 text-center select-none">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
