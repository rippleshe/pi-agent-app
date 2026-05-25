/**
 * 主应用组件
 *
 * 布局：自定义标题栏 + 左侧边栏 + 主聊天区 + 设置面板（弹窗）
 *
 * 核心流程：
 * 1. 用户输入 → sendMessage IPC → 主进程 → AI
 * 2. AI 流式输出 → ai-stream-delta 事件 → 累积 streamingContent
 * 3. AI 一轮结束 → ai-stream-end 事件 → 合并到消息列表，重置等待状态
 */

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { TitleBar } from './components/TitleBar';
import { Message, ToolConfig, AIInitStatus, DEFAULT_TOOLS } from './types';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是你的 AI 编码助手。我可以帮助你读取文件、执行命令、搜索代码等。有什么可以帮你的吗？',
  timestamp: Date.now(),
};

export default function App() {
  // ── 消息状态 ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  // ── UI 状态 ──────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── AI 状态 ──────────────────────────────────────────────────────
  const [aiStatus, setAiStatus] = useState<AIInitStatus>('loading');
  const [aiError, setAiError] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolConfig[]>(DEFAULT_TOOLS);

  // ── AI 事件监听 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) {
      setAiStatus('error');
      setAiError('Electron API not available');
      return;
    }

    // 流式文本增量 → 累积到 streamingContent
    window.electronAPI.onAIDelta((delta: string) => {
      setStreamingContent(prev => prev + delta);
    });

    // AI 一轮响应结束 → 将流式内容合并到消息列表
    window.electronAPI.onAIStreamEnd(() => {
      setStreamingContent(prev => {
        if (prev) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: prev,
            timestamp: Date.now(),
          };
          setMessages(msgs => [...msgs, aiMessage]);
        }
        return ''; // 清空流式缓冲
      });
      setIsWaiting(false);
    });

    // AI 初始化成功
    window.electronAPI.onAIInitSuccess(() => {
      setAiStatus('ready');
      setAiError(null);
    });

    // AI 初始化失败
    window.electronAPI.onAIInitError((message: string) => {
      setAiStatus('error');
      setAiError(message);
      setIsWaiting(false);
    });

    // 检查当前初始化状态（页面刷新时）
    window.electronAPI.getInitStatus().then(({ initialized }) => {
      if (initialized) {
        setAiStatus('ready');
      }
    });

    return () => {
      window.electronAPI?.removeAllAIListeners();
    };
  }, []);

  // ── 发送消息 ─────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isWaiting || aiStatus !== 'ready') return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsWaiting(true);
    setStreamingContent('');

    try {
      const result = await window.electronAPI.sendMessage(content.trim());
      if (result.error) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `错误：${result.error}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsWaiting(false);
      }
      // 成功时不设置 isWaiting = false
      // 等待 ai-stream-end 事件触发
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
  const handleToggleTool = useCallback(async (toolId: string) => {
    setTools(prev => {
      const updated = prev.map(tool =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      );
      // 同步启用的工具列表到主进程（会触发会话重建）
      const enabledIds = updated.filter(t => t.enabled).map(t => t.id);
      window.electronAPI?.setTools(enabledIds);
      return updated;
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* ── 自定义标题栏（frame: false 需要） ── */}
      <TitleBar />

      {/* ── 主内容区 ── */}
      <div className="flex flex-1 min-h-0">
        {/* 左侧边栏 */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClearChat={handleClearChat}
          onOpenSettings={() => setSettingsOpen(true)}
          tools={tools}
          onToggleTool={handleToggleTool}
        />

        {/* 主聊天区域 */}
        <ChatArea
          messages={messages}
          streamingContent={streamingContent}
          isWaiting={isWaiting}
          aiStatus={aiStatus}
          aiError={aiError}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* 设置面板（弹窗） */}
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
