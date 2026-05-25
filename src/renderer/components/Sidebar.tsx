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
    <motion.aside initial={false}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col bg-white border-r border-slate-200 relative z-10"
    >
      <div className="flex items-center justify-between px-3 h-14 border-b border-slate-100">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-semibold text-sm text-slate-900">AI 助手</span>
          </motion.div>
        )}
        <button onClick={onToggleCollapse}
          className={cn('p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer', collapsed && 'mx-auto')}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 text-slate-500" /> : <PanelLeftClose className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">工具</span>
          </div>
          <div className="space-y-1">
            {tools.map(tool => {
              const Icon = getToolIcon(tool.icon);
              return (
                <div key={tool.id} className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer',
                  tool.enabled ? 'bg-emerald-50' : 'hover:bg-slate-50'
                )}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', tool.enabled ? 'text-emerald-500' : 'text-slate-400')} />
                    <span className={cn('text-[13px]', tool.enabled ? 'text-slate-900' : 'text-slate-500')}>{tool.name}</span>
                  </div>
                  <ToggleSwitch enabled={tool.enabled} onChange={() => onToggleTool(tool.id)} label={tool.name} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="border-t border-slate-100 px-2 py-2 space-y-0.5">
        {[
          { icon: Trash2, label: '清空对话', onClick: onClearChat, danger: true },
          { icon: Settings, label: '设置', onClick: onOpenSettings },
        ].map(({ icon: Icon, label, onClick, danger }) => (
          <button key={label} onClick={onClick}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors min-h-[36px] cursor-pointer',
              danger ? 'text-red-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
