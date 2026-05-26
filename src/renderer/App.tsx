import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { TitleBar } from './components/TitleBar';
import { Message, ToolConfig, AIInitStatus, DEFAULT_TOOLS } from './types';
import { api } from './lib/api';

const WELCOME: Message = {
  id: 'welcome', role: 'assistant',
  content: '你好！我是你的 AI 编码助手，可以帮你读取文件、执行命令、搜索代码。有什么可以帮你的吗？',
  timestamp: Date.now(),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [streaming, setStreaming] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIInitStatus>('loading');
  const [aiError, setAiError] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolConfig[]>(DEFAULT_TOOLS);

  // 安全超时：如果 30 秒没有收到 stream-end，自动重置
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.onAIDelta((delta: string) => {
      setStreaming(prev => prev + delta);
    });

    api.onAIStreamEnd(() => {
      setStreaming(prev => {
        if (prev) {
          setMessages(msgs => [...msgs, {
            id: `ai-${Date.now()}`, role: 'assistant', content: prev, timestamp: Date.now(),
          }]);
        }
        return '';
      });
      setWaiting(false);
      if (waitTimerRef.current) { clearTimeout(waitTimerRef.current); waitTimerRef.current = null; }
    });

    api.onAIInitSuccess(() => { setAiStatus('ready'); setAiError(null); });
    api.onAIInitError((msg: string) => { setAiStatus('error'); setAiError(msg); setWaiting(false); });

    // 主动查询初始化状态
    api.getInitStatus().then(({ initialized }) => {
      if (initialized) setAiStatus('ready');
    });

    return () => { api.removeAllAIListeners(); };
  }, []);

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() || waiting || aiStatus !== 'ready') return;

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`, role: 'user', content: content.trim(), timestamp: Date.now(),
    }]);
    setWaiting(true);
    setStreaming('');

    // 安全超时
    waitTimerRef.current = setTimeout(() => {
      setWaiting(false);
      setStreaming(prev => {
        if (prev) {
          setMessages(msgs => [...msgs, {
            id: `ai-${Date.now()}`, role: 'assistant', content: prev + '\n\n_[响应超时]_', timestamp: Date.now(),
          }]);
        }
        return '';
      });
    }, 30000);

    try {
      const result = await api.sendMessage(content.trim());
      if (result.error) {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`, role: 'assistant', content: `错误：${result.error}`, timestamp: Date.now(),
        }]);
        setWaiting(false);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant', content: `发送失败：${(e as Error).message}`, timestamp: Date.now(),
      }]);
      setWaiting(false);
    }
  }, [waiting, aiStatus]);

  const handleClear = useCallback(() => {
    setMessages([WELCOME]); setStreaming(''); setWaiting(false);
  }, []);

  const handleToggleTool = useCallback((id: string) => {
    setTools(prev => {
      const next = prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t);
      api.setTools(next.filter(t => t.enabled).map(t => t.id));
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#f9fafb]">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)}
          onClearChat={handleClear} onOpenSettings={() => setSettingsOpen(true)}
          tools={tools} onToggleTool={handleToggleTool} />
        <ChatArea messages={messages} streamingContent={streaming} isWaiting={waiting}
          aiStatus={aiStatus} aiError={aiError} onSendMessage={handleSend} />
      </div>
      {settingsOpen && <SettingsPanel tools={tools} onToggleTool={handleToggleTool} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
