import { motion } from 'framer-motion';
import { Settings, Trash2, PanelLeftClose, PanelLeftOpen, Wrench, Zap } from 'lucide-react';
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
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col bg-white border-r border-border relative z-10"
    >
      {/* ── 头部 ── */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-border/60">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-semibold text-sm text-text-primary">AI 助手</span>
          </motion.div>
        )}
        <button onClick={onToggleCollapse}
          className={cn('p-1.5 rounded-lg hover:bg-gray-100 transition-colors', collapsed && 'mx-auto')}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4 text-gray-400" />
            : <PanelLeftClose className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* ── 工具列表 ── */}
      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <Wrench className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">工具</span>
          </div>
          <div className="space-y-1">
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.icon);
              return (
                <div key={tool.id} className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                  tool.enabled ? 'bg-sky-50' : 'hover:bg-gray-50'
                )}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', tool.enabled ? 'text-sky-500' : 'text-gray-400')} />
                    <span className={cn('text-[13px]', tool.enabled ? 'text-gray-800' : 'text-gray-400')}>
                      {tool.name}
                    </span>
                  </div>
                  <ToggleSwitch enabled={tool.enabled} onChange={() => onToggleTool(tool.id)} label={`${tool.name}`} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── 底部 ── */}
      <div className="border-t border-border/60 px-2 py-2 space-y-0.5">
        {[
          { icon: Trash2, label: '清空对话', onClick: onClearChat, danger: true },
          { icon: Settings, label: '设置', onClick: onOpenSettings, danger: false },
        ].map(({ icon: Icon, label, onClick, danger }) => (
          <button key={label} onClick={onClick}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors min-h-[36px]',
              danger ? 'text-red-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            )}
          >
            <Icon className="w-4 h-4" />
            {!collapsed && <span className="text-[13px]">{label}</span>}
          </button>
        ))}
      </div>
    </motion.aside>
  );
}
