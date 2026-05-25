import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../lib/utils';
import { Message } from '../types';

interface Props { message: Message; }

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 hover:bg-white border border-gray-200 transition-all opacity-0 group-hover/code:opacity-100"
      aria-label={copied ? '已复制' : '复制'}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
    </button>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /`([^`]+)`/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      text.slice(last, m.index).split('\n').forEach((seg, i) => {
        if (i > 0) parts.push(<br key={`br-${k++}`} />);
        if (seg) parts.push(<span key={`t-${k++}`}>{seg}</span>);
      });
    }
    parts.push(
      <code key={`c-${k++}`} className="px-1.5 py-0.5 bg-sky-50 rounded text-xs font-mono text-sky-600">
        {m[1]}
      </code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    text.slice(last).split('\n').forEach((seg, i) => {
      if (i > 0) parts.push(<br key={`br-${k++}`} />);
      if (seg) parts.push(<span key={`t-${k++}`}>{seg}</span>);
    });
  }
  return parts;
}

function formatContent(content: string): React.ReactNode {
  const esc = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const parts: React.ReactNode[] = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(esc)) !== null) {
    if (m.index > last) parts.push(<Fragment key={`t-${k++}`}>{renderInline(esc.slice(last, m.index))}</Fragment>);
    const code = m[2].trim();
    parts.push(
      <div key={`pre-${k++}`} className="relative my-3 rounded-lg border border-gray-200 overflow-hidden group/code">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
          <span className="text-[11px] text-gray-400 font-mono">{m[1] || 'code'}</span>
        </div>
        <pre className="p-3 overflow-x-auto text-xs font-mono text-gray-700 leading-relaxed bg-white">
          <code>{code}</code>
        </pre>
        <CopyBtn text={code} />
      </div>
    );
    last = m.index + m[0].length;
  }
  if (last < esc.length) parts.push(<Fragment key={`t-${k++}`}>{renderInline(esc.slice(last))}</Fragment>);
  return parts.length > 0 ? parts : renderInline(esc);
}

function formatTime(ts: number): string {
  const d = new Date(ts), now = new Date(), diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3 group max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
    >
      {/* 头像 */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-gray-200' : 'bg-sky-500'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-gray-500" />
          : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>

      {/* 内容 */}
      <div className={cn('flex-1', isUser ? 'flex justify-end' : '')}>
        <div className={cn(
          'px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-sky-500 text-white rounded-2xl rounded-tr-md shadow-sm max-w-[80%]'
            : 'bg-white text-gray-800 rounded-2xl rounded-tl-md shadow-sm border border-gray-100'
        )}>
          {isUser
            ? <span className="whitespace-pre-wrap break-words">{message.content}</span>
            : <div>{formatContent(message.content)}</div>}
        </div>
        <span className={cn(
          'block mt-1 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
