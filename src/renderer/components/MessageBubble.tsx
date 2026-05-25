/**
 * 消息气泡组件
 *
 * 【职责】显示单条消息，区分用户和 AI 的样式
 * - 用户消息：靠右，紫色渐变背景
 * - AI 消息：靠左，白色背景，支持代码块格式化
 *
 * 【Markdown 渲染策略】
 * 这里没有引入完整的 Markdown 解析库（如 react-markdown），
 * 而是用正则表达式手动解析代码块（```...```）和内联代码（`...`）。
 * 对于这个小项目来说足够了，也避免了引入大型依赖。
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../lib/utils';
import { Message } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

interface MessageBubbleProps {
  /** 单条消息数据 */
  message: Message;
}

// ═══════════════════════════════════════════════════════════════════
// 复制按钮组件
// ═══════════════════════════════════════════════════════════════════

/**
 * 【组件内组件】
 * CopyButton 只在 MessageBubble 内部使用，所以定义在同一个文件里。
 * 如果其他组件也需要用，就应该提取到单独的文件。
 *
 * 【useState 用于 UI 状态】
 * copied 状态只控制"显示勾号还是复制图标"，是纯 UI 逻辑，
 * 不需要提升到父组件。
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // 【Clipboard API】现代浏览器的剪贴板 API
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2 秒后恢复
    } catch {
      // 【降级方案】
      // navigator.clipboard 在某些环境不可用（非 HTTPS、Electron 某些版本）
      // 降级到 document.execCommand('copy')（旧式但兼容性好）
      console.warn('Clipboard API unavailable, falling back to execCommand');
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px'; // 移出屏幕外，用户看不到
      document.body.appendChild(textarea);
      textarea.select();               // 选中文本
      document.execCommand('copy');     // 执行复制命令
      document.body.removeChild(textarea); // 清理 DOM
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
      {/* 三元表达式：根据 copied 状态切换图标 */}
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 文本格式化函数
// ═══════════════════════════════════════════════════════════════════

/**
 * 将文本中的内联代码（`code`）转换为 React 元素
 *
 * 【正则表达式 /`([^`]+)`/g】
 * - /.../g: 全局匹配（找到所有匹配，不只是第一个）
 * - `: 匹配反引号
 * - (): 捕获组，提取反引号内的内容
 * - [^`]+: 匹配一个或多个非反引号字符
 *
 * 示例输入: "使用 `npm install` 安装依赖"
 * 示例输出: [<span>使用 </span>, <code>npm install</code>, <span> 安装依赖</span>]
 */
function renderInlineCode(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0; // 用于生成唯一的 key

  // 【exec 循环模式】
  // exec 每次调用返回下一个匹配，直到返回 null
  // lastIndex 记录上次匹配结束的位置
  while ((match = inlineCodeRegex.exec(text)) !== null) {
    // 匹配前的普通文本（可能包含换行符）
    if (match.index > lastIndex) {
      const segments = text.slice(lastIndex, match.index).split('\n');
      segments.forEach((segment, i) => {
        if (i > 0) parts.push(<br key={`br-${keyIndex++}`} />);
        if (segment) parts.push(<span key={`t-${keyIndex++}`}>{segment}</span>);
      });
    }

    // 内联代码
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

  // 剩余文本
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
 * 格式化消息内容：解析代码块和内联代码，返回 React 元素
 *
 * 【Fragment 是什么？】
 * <Fragment>...</Fragment>（简写 <></>）是 React 的"空标签"。
 * 它不会渲染任何 DOM 元素，只是用来包裹多个子元素。
 * 比如一个函数需要返回两个 <div>，不能直接 return <div/><div/>，
 * 必须包一层：<><div/><div/></>
 */
function formatContent(content: string): React.ReactNode {
  // 先转义 HTML 特殊字符，防止 XSS
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const parts: React.ReactNode[] = [];
  // 匹配 ```语言名\n代码内容```
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = codeBlockRegex.exec(escaped)) !== null) {
    // 代码块前的文本
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${keyIndex++}`}>
          {renderInlineCode(escaped.slice(lastIndex, match.index))}
        </Fragment>
      );
    }

    const lang = match[1] || 'code';
    const codeContent = match[2].trim();

    // 代码块（带语言标签和复制按钮）
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

  // 剩余文本
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
 * 格式化时间戳为可读文字
 *
 * 【时间处理思路】
 * 用时间差来判断显示格式：
 * - 刚刚（< 1 分钟）
 * - X 分钟前（< 1 小时）
 * - 今天 HH:MM
 * - 昨天 HH:MM
 * - M月D日 HH:MM
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════

export function MessageBubble({ message }: MessageBubbleProps) {
  // 【派生值】从 message.role 推导出是否为用户消息
  // 不需要 useState，因为它是纯计算
  const isUser = message.role === 'user';

  return (
    <motion.div
      // 入场动画：从下方淡入
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      // 【条件类名】用户消息靠右显示
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
          {/* 用户消息直接显示文本；AI 消息经过格式化（解析代码块） */}
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          ) : (
            <div className="[&>pre]:text-xs [&>pre_code]:text-xs">
              {formatContent(message.content)}
            </div>
          )}
        </div>

        {/* 时间戳：默认隐藏，鼠标悬停时显示 */}
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
