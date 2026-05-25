/**
 * 根组件 — App
 *
 * 职责：管理全局状态、监听 AI 事件、组装页面布局
 */

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { TitleBar } from './components/TitleBar';
import { Message, ToolConfig, AIInitStatus, DEFAULT_TOOLS } from './types';
import { api } from './lib/api';

// ── 欢迎消息（组件外常量，避免重复创建）────────────────────────────
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是你的 AI 编码助手，可以帮你读取文件、执行命令、搜索代码。有什么可以帮你的吗？',
  timestamp: Date.now(),
};

export default function App() {
  // ── 状态定义 ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIInitStatus>('loading');
  const [aiError, setAiError] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolConfig[]>(DEFAULT_TOOLS);

  // ── 订阅 AI 事件 ─────────────────────────────────────────────────
  useEffect(() => {
    // 流式文本增量
    api.onAIDelta((delta: string) => {
      setStreamingContent(prev => prev + delta);
    });

    // 一轮回答完成 → 合并到消息列表
    api.onAIStreamEnd(() => {
      setStreamingContent(prev => {
        if (prev) {
          setMessages(msgs => [...msgs, {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: prev,
            timestamp: Date.now(),
          }]);
        }
        return '';
      });
      setIsWaiting(false);
    });

    // 初始化成功
    api.onAIInitSuccess(() => {
      setAiStatus('ready');
      setAiError(null);
    });

    // 初始化失败
    api.onAIInitError((message: string) => {
      setAiStatus('error');
      setAiError(message);
      setIsWaiting(false);
    });

    // 查询当前状态
    api.getInitStatus().then(({ initialized }) => {
      if (initialized) setAiStatus('ready');
    });

    return () => api.removeAllAIListeners();
  }, []);

  // ── 发送消息 ─────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isWaiting || aiStatus !== 'ready') return;

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    }]);
    setIsWaiting(true);
    setStreamingContent('');

    try {
      const result = await api.sendMessage(content.trim());
      if (result.error) {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `错误：${result.error}`,
          timestamp: Date.now(),
        }]);
        setIsWaiting(false);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `发送失败：${(error as Error).message}`,
        timestamp: Date.now(),
      }]);
      setIsWaiting(false);
    }
  }, [isWaiting, aiStatus]);

  // ── 清空对话 ─────────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setStreamingContent('');
    setIsWaiting(false);
  }, []);

  // ── 工具开关 ─────────────────────────────────────────────────────
  const handleToggleTool = useCallback((toolId: string) => {
    setTools(prev => {
      const updated = prev.map(t =>
        t.id === toolId ? { ...t, enabled: !t.enabled } : t
      );
      api.setTools(updated.filter(t => t.enabled).map(t => t.id));
      return updated;
    });
  }, []);

  // ── 渲染 ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <TitleBar />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClearChat={handleClearChat}
          onOpenSettings={() => setSettingsOpen(true)}
          tools={tools}
          onToggleTool={handleToggleTool}
        />

        <ChatArea
          messages={messages}
          streamingContent={streamingContent}
          isWaiting={isWaiting}
          aiStatus={aiStatus}
          aiError={aiError}
          onSendMessage={handleSendMessage}
        />
      </div>

      {settingsOpen && (
        <SettingsPanel
          tools={tools}
          onToggleTool={handleToggleTool}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
