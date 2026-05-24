/**
 * 消息气泡组件
 *
 * 显示单条消息，支持用户和 AI 两种样式
 * 支持代码块和内联代码的格式化显示
 */

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../lib/utils';
import { Message } from '../types';

interface MessageBubbleProps {
  /** 消息数据 */
  message: Message;
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
        className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono"
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
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
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

    // 添加代码块
    parts.push(
      <pre
        key={`pre-${keyIndex++}`}
        className="my-2 p-3 bg-slate-100 rounded-lg overflow-x-auto text-sm font-mono"
      >
        <code>{match[2]}</code>
      </pre>
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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* 头像 */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser
            ? 'bg-surface-hover'
            : 'bg-gradient-to-br from-primary to-primary-dark'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-text-secondary" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={cn('flex-1 max-w-[70%]', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl shadow-sm leading-relight',
            isUser
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-sm'
              : 'bg-surface text-text-primary rounded-bl-sm'
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div>{formatContent(message.content)}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
