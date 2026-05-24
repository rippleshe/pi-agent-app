/**
 * 消息气泡组件
 *
 * 显示单条消息，支持用户和 AI 两种样式
 * 支持代码块和内联代码的格式化显示
 * 
 * UX 改进（基于 UI/UX Pro Max）：
 * - 代码块复制按钮
 * - 时间戳显示
 * - 更好的代码块样式
 * - 文本选择支持
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../lib/utils';
import { Message } from '../types';

interface MessageBubbleProps {
  /** 消息数据 */
  message: Message;
}

/**
 * 复制按钮组件
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案：navigator.clipboard 在非安全上下文（非 HTTPS / localhost）不可用
      console.warn('Clipboard API unavailable, falling back to execCommand');
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'absolute top-2 right-2 p-1.5 rounded-md',
        'bg-surface/80 hover:bg-surface border border-border/50',
        'transition-all duration-200',
        'min-w-[32px] min-h-[32px] flex items-center justify-center',
        'text-text-muted hover:text-text-secondary'
      )}
      aria-label={copied ? '已复制' : '复制代码'}
      title={copied ? '已复制到剪贴板' : '复制代码'}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

/**
 * 将文本按内联代码分割，返回 React 元素数组
 */
function renderInlineCode(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    // 添加代码块前的普通文本
    if (match.index > lastIndex) {
      const segments = text.slice(lastIndex, match.index).split('\n');
      segments.forEach((segment, i) => {
        if (i > 0) parts.push(<br key={`br-${keyIndex++}`} />);
        if (segment) parts.push(<span key={`t-${keyIndex++}`}>{segment}</span>);
      });
    }

    // 添加内联代码
    parts.push(
      <code
        key={`code-${keyIndex++}`}
        className="px-1.5 py-0.5 bg-primary/10 rounded text-xs font-mono text-primary"
      >
        {match[1]}
      </code>
    );

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    const segments = text.slice(lastIndex).split('\n');
    segments.forEach((segment, i) => {
      if (i > 0) parts.push(<br key={`br-end-${keyIndex++}`} />);
      if (segment) parts.push(<span key={`t-end-${keyIndex++}`}>{segment}</span>);
    });
  }

  return parts;
}

/**
 * 格式化消息内容，支持代码块和内联代码
 * 返回 React 元素数组
 */
function formatContent(content: string): React.ReactNode {
  // 转义 HTML
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = codeBlockRegex.exec(escaped)) !== null) {
    // 添加代码块前的文本
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${keyIndex++}`}>
          {renderInlineCode(escaped.slice(lastIndex, match.index))}
        </Fragment>
      );
    }

    const lang = match[1] || 'code';
    const codeContent = match[2].trim();

    // 添加代码块（带复制按钮，使用语义化颜色变量支持暗色模式）
    parts.push(
      <div
        key={`pre-${keyIndex++}`}
        className="relative my-2 group rounded-lg border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-hover border-b border-border">
          <span className="text-xs text-text-muted font-mono">{lang}</span>
        </div>
        <pre className="p-3 pb-4 bg-surface rounded-b-lg overflow-x-auto text-sm font-mono text-text-primary leading-relaxed">
          <code>{codeContent}</code>
        </pre>
        <CopyButton text={codeContent} />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余文本
  if (lastIndex < escaped.length) {
    parts.push(
      <Fragment key={`text-end-${keyIndex++}`}>
        {renderInlineCode(escaped.slice(lastIndex))}
      </Fragment>
    );
  }

  return parts.length > 0 ? parts : renderInlineCode(escaped);
}

/**
 * 格式化时间显示
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于 1 小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  }
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // 其他
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}
    >
      {/* 头像 */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          isUser
            ? 'bg-surface-hover border border-border'
            : 'bg-gradient-to-br from-primary to-primary-dark shadow-sm'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-text-secondary" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={cn('flex-1 max-w-[85%] sm:max-w-[75%]', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed',
            isUser
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-md'
              : 'bg-surface text-text-primary rounded-bl-md border border-border/50'
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          ) : (
            <div className="[&>pre]:text-xs [&>pre_code]:text-xs">{formatContent(message.content)}</div>
          )}
        </div>
        
        {/* 时间戳 */}
        <span className={cn(
          'block mt-1 text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
