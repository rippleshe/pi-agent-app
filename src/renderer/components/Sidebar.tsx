/**
 * 侧边栏 — 清新典雅风格
 *
 * 设计要点：
 * - 毛玻璃背景 + 柔和边框
 * - 工具图标用主色调小圆点装饰
 * - 折叠时只保留图标，宽度 56px
 */

import { motion } from 'framer-motion';
import { Bot, Settings, Trash2, PanelLeftClose, PanelLeftOpen, Wrench, Leaf } from 'lucide-react';
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

export function Sidebar({ collapsed, onToggleCollapse, onClearChat, onOpenSettings, tools, onToggleTool }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col bg-surface/70 backdrop-blur-xl border-r border-border/40 relative z-10"
    >
      {/* ── 头部 ── */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-border/30">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm text-text-primary tracking-tight">AI 助手</span>
          </motion.div>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-200',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4 text-text-muted" />
            : <PanelLeftClose className="w-4 h-4 text-text-muted" />}
        </button>
      </div>

      {/* ── 工具列表 ── */}
      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Wrench className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em]">工具</span>
          </div>
          <div className="space-y-0.5">
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.icon);
              return (
                <div key={tool.id} className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200',
                  tool.enabled ? 'bg-primary/[0.04]' : 'hover:bg-surface-hover'
                )}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', tool.enabled ? 'text-primary' : 'text-text-muted')} />
                    <span className={cn('text-[13px]', tool.enabled ? 'text-text-primary' : 'text-text-muted')}>
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
      <div className="border-t border-border/30 px-2 py-2 space-y-0.5">
        {[
          { icon: Trash2, label: '清空对话', onClick: onClearChat, danger: true },
          { icon: Settings, label: '设置', onClick: onOpenSettings, danger: false },
        ].map(({ icon: Icon, label, onClick, danger }) => (
          <button
            key={label}
            onClick={onClick}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 min-h-[38px]',
              danger ? 'text-error/70 hover:bg-error/5 hover:text-error' : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary'
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span className="text-[13px]">{label}</span>}
          </button>
        ))}
      </div>
    </motion.aside>
  );
}
