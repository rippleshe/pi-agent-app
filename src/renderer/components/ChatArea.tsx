/**
 * 聊天区域组件
 * 
 * 功能：
 * - 显示消息列表
 * - 流式输出动画
 * - 输入框和发送按钮
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
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

  /**
   * 自动滚动到底部
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  /**
   * 自动调整文本框高度
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  /**
   * 处理发送
   */
  const handleSend = () => {
    if (!input.trim() || isWaiting) return;
    onSendMessage(input.trim());
    setInput('');
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* 顶部状态栏 */}
      <header className="flex items-center gap-3 px-6 py-4 bg-surface border-b border-border shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-text-primary">AI 编码助手</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-muted">DeepSeek V4 Flash 在线</span>
          </div>
        </div>
      </header>

      {/* 消息列表区域 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
      >
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
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 max-w-[70%]">
              <div className="bg-surface rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="text-text-primary leading-relight whitespace-pre-wrap">
                  {streamingContent}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 打字指示器 */}
        {isWaiting && !streamingContent && <TypingIndicator />}
      </div>

      {/* 输入区域 */}
      <div className="bg-surface border-t border-border px-6 py-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，例如：帮我看看当前目录下有哪些文件..."
              rows={1}
              className={cn(
                'w-full px-4 py-3 pr-12',
                'bg-background border-2 border-border rounded-xl',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-primary',
                'resize-none transition-colors',
                'max-h-[120px]'
              )}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isWaiting}
            className={cn(
              'px-6 py-3 rounded-xl font-medium',
              'transition-all duration-200',
              'flex items-center gap-2',
              input.trim() && !isWaiting
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-border text-text-muted cursor-not-allowed'
            )}
          >
            {isWaiting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>发送</span>
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
