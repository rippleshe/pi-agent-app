/**
 * 主应用组件
 * 
 * 应用的整体布局结构：
 * - 左侧边栏：会话列表、工具设置
 * - 主内容区：聊天界面
 */

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsPanel } from './components/SettingsPanel';
import { Message, ToolConfig } from './types';

/**
 * 默认欢迎消息
 */
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是你的 AI 编码助手。我可以帮助你读取文件、执行命令、搜索代码等。有什么可以帮你的吗？',
  timestamp: Date.now(),
};

export default function App() {
  // 消息列表状态
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  
  // 当前流式消息内容
  const [streamingContent, setStreamingContent] = useState<string>('');
  
  // 是否正在等待 AI 响应
  const [isWaiting, setIsWaiting] = useState(false);
  
  // 侧边栏是否折叠
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 设置面板是否打开
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // 工具配置
  const [tools, setTools] = useState<ToolConfig[]>([
    { id: 'read', name: '读取文件', enabled: true, icon: 'file' },
    { id: 'bash', name: '执行命令', enabled: true, icon: 'terminal' },
    { id: 'grep', name: '搜索代码', enabled: true, icon: 'search' },
    { id: 'find', name: '查找文件', enabled: true, icon: 'folder' },
    { id: 'ls', name: '列出目录', enabled: true, icon: 'list' },
  ]);

  /**
   * 监听 AI 流式输出
   */
  useEffect(() => {
    // 接收 AI 的文本增量
    const handleAIDelta = (_event: unknown, delta: string) => {
      setStreamingContent(prev => prev + delta);
    };

    // 注册监听器
    window.electronAPI.onAIDelta(handleAIDelta);

    // 清理函数：组件卸载时移除监听器
    return () => {
      window.electronAPI.removeAIDeltaListener();
    };
  }, []);

  /**
   * 当流式内容变化且结束时，添加到消息列表
   */
  useEffect(() => {
    if (streamingContent && !isWaiting) {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: streamingContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setStreamingContent('');
    }
  }, [streamingContent, isWaiting]);

  /**
   * 发送消息到 AI
   */
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isWaiting) return;

    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsWaiting(true);
    setStreamingContent('');

    // 发送到主进程
    try {
      const result = await window.electronAPI.sendMessage(content.trim());
      
      if (result.error) {
        // 发生错误，添加错误消息
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ 错误：${result.error}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsWaiting(false);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ 发送失败：${(error as Error).message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsWaiting(false);
    }
  }, [isWaiting]);

  /**
   * 清空对话
   */
  const handleClearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setStreamingContent('');
    setIsWaiting(false);
  }, []);

  /**
   * 切换工具状态
   */
  const handleToggleTool = useCallback((toolId: string) => {
    setTools(prev =>
      prev.map(tool =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
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
        onSendMessage={handleSendMessage}
      />

      {/* 设置面板 */}
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
