/**
 * 侧边栏组件
 * 
 * 功能：
 * - 显示应用标题和状态
 * - 工具开关管理
 * - 清空对话、设置等操作按钮
 */

import { motion } from 'framer-motion';
import {
  Bot,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
  Search,
  FolderOpen,
  FileText,
  List,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ToolConfig } from '../types';

/**
 * 工具图标映射
 */
const TOOL_ICONS: Record<string, React.ElementType> = {
  file: FileText,
  terminal: Terminal,
  search: Search,
  folder: FolderOpen,
  list: List,
};

interface SidebarProps {
  /** 侧边栏是否折叠 */
  collapsed: boolean;
  /** 切换折叠状态 */
  onToggleCollapse: () => void;
  /** 清空对话 */
  onClearChat: () => void;
  /** 打开设置 */
  onOpenSettings: () => void;
  /** 工具列表 */
  tools: ToolConfig[];
  /** 切换工具状态 */
  onToggleTool: (toolId: string) => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onClearChat,
  onOpenSettings,
  tools,
  onToggleTool,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'flex flex-col bg-surface border-r border-border',
        'shadow-lg relative z-10'
      )}
    >
      {/* 顶部标题区域 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-text-primary">AI 编码助手</span>
          </motion.div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-text-secondary" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-text-secondary" />
          )}
        </button>
      </div>

      {/* 工具列表区域 */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">可用工具</span>
          </div>
          
          <div className="space-y-2">
            {tools.map((tool) => {
              const Icon = TOOL_ICONS[tool.icon] || Wrench;
              return (
                <button
                  key={tool.id}
                  onClick={() => onToggleTool(tool.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    tool.enabled
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-surface-hover text-text-muted hover:bg-border'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left text-sm">{tool.name}</span>
                  <div
                    className={cn(
                      'w-8 h-5 rounded-full relative transition-colors',
                      tool.enabled ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        tool.enabled ? 'left-3.5' : 'left-0.5'
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 底部操作按钮 */}
      <div className={cn(
        'border-t border-border p-3',
        collapsed ? 'space-y-2' : 'space-y-2'
      )}>
        <button
          onClick={onClearChat}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-error hover:bg-error/10 transition-colors'
          )}
          title="清空对话"
        >
          <Trash2 className="w-4 h-4" />
          {!collapsed && <span className="text-sm">清空对话</span>}
        </button>
        
        <button
          onClick={onOpenSettings}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-text-secondary hover:bg-surface-hover transition-colors'
          )}
          title="设置"
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span className="text-sm">设置</span>}
        </button>
      </div>
    </motion.aside>
  );
}
