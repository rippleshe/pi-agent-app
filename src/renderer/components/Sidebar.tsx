/**
 * 侧边栏组件
 *
 * 功能：应用标题、工具开关、清空对话、设置按钮
 * 支持折叠/展开动画
 */

import { motion } from 'framer-motion';
import {
  Bot,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getToolIcon } from '../lib/icons';
import { ToolConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  tools: ToolConfig[];
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
        'shadow-sm relative z-10'
      )}
    >
      {/* ── 顶部标题 ── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary text-sm truncate">
              AI 编码助手
            </span>
          </motion.div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-text-secondary" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>

      {/* ── 工具列表 ── */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 overflow-y-auto px-3 py-3"
        >
          <div className="flex items-center gap-2 mb-2 px-2">
            <Wrench className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              可用工具
            </span>
          </div>

          <div className="space-y-1">
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.icon);
              return (
                <div
                  key={tool.id}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    'transition-colors duration-200',
                    tool.enabled ? 'bg-primary/5' : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn(
                      'w-4 h-4 flex-shrink-0',
                      tool.enabled ? 'text-primary' : 'text-text-muted'
                    )} />
                    <span className={cn(
                      'text-sm truncate',
                      tool.enabled ? 'text-text-primary' : 'text-text-muted'
                    )}>
                      {tool.name}
                    </span>
                  </div>
                  <ToggleSwitch
                    enabled={tool.enabled}
                    onChange={() => onToggleTool(tool.id)}
                    label={`${tool.enabled ? '关闭' : '开启'} ${tool.name}`}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── 底部操作 ── */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <button
          onClick={onClearChat}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-error hover:bg-error/10 transition-colors duration-200',
            'min-h-[44px]'
          )}
          title="清空对话"
          aria-label="清空当前对话"
        >
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">清空对话</span>}
        </button>

        <button
          onClick={onOpenSettings}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-text-secondary hover:bg-surface-hover transition-colors duration-200',
            'min-h-[44px]'
          )}
          title="设置"
          aria-label="打开设置面板"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">设置</span>}
        </button>
      </div>
    </motion.aside>
  );
}
