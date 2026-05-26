import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, User } from 'lucide-react';
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
      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors cursor-pointer"
      aria-label={copied ? '已复制' : '复制代码'}
    >
      {copied ? <><Check className="w-3 h-3" /><span>已复制</span></> : <><Copy className="w-3 h-3" /><span>复制</span></>}
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
        if (i > 0) parts.push(<br key={`br${k++}`} />);
        if (seg) parts.push(<span key={`t${k++}`}>{seg}</span>);
      });
    }
    parts.push(<code key={`c${k++}`} className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono text-gray-700">{m[1]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    text.slice(last).split('\n').forEach((seg, i) => {
      if (i > 0) parts.push(<br key={`br${k++}`} />);
      if (seg) parts.push(<span key={`t${k++}`}>{seg}</span>);
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
    if (m.index > last) parts.push(<Fragment key={`t${k++}`}>{renderInline(esc.slice(last, m.index))}</Fragment>);
    const code = m[2].trim();
    parts.push(
      <div key={`pre${k++}`} className="my-3 rounded-lg overflow-hidden border border-[#3e3e3e]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d]">
          <span className="text-[11px] text-[#858585] font-mono">{m[1] || 'code'}</span>
          <CopyBtn text={code} />
        </div>
        <pre className="p-3 overflow-x-auto bg-[#1e1e1e] text-[13px] font-mono leading-relaxed"><code className="text-[#d4d4d4]">{code}</code></pre>
      </div>
    );
    last = m.index + m[0].length;
  }
  if (last < esc.length) parts.push(<Fragment key={`t${k++}`}>{renderInline(esc.slice(last))}</Fragment>);
  return parts.length > 0 ? parts : renderInline(esc);
}

function formatTime(ts: number): string {
  const d = new Date(ts), now = new Date(), diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : '')}
    >
      {/* 头像 */}
      <div className={cn(
        'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-gray-200' : 'bg-gray-900'
      )}>
        {isUser
          ? <User className="w-3 h-3 text-gray-500" />
          : <span className="text-[9px] font-bold text-white">AI</span>}
      </div>

      {/* 内容 */}
      <div className={cn('flex-1 max-w-[85%]', isUser ? 'flex justify-end' : '')}>
        <div className={cn(
          isUser
            ? 'inline-block bg-gray-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[14px] leading-relaxed'
            : 'bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-2xl rounded-tl-md text-[14px] leading-relaxed'
        )}>
          {isUser
            ? <span className="whitespace-pre-wrap break-words">{message.content}</span>
            : <div>{formatContent(message.content)}</div>}
        </div>
        <span className={cn(
          'block mt-1 text-[11px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
