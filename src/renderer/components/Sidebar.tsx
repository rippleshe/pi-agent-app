import { motion } from 'framer-motion';
import { Settings, Trash2, PanelLeftClose, PanelLeftOpen, Wrench, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { getToolIcon } from '../lib/icons';
import { ToolConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  tools: ToolConfig[];
  onToggleTool: (id: string) => void;
}

export function Sidebar({ collapsed, onToggleCollapse, onClearChat, onOpenSettings, tools, onToggleTool }: Props) {
  return (
    <motion.aside initial={false}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col bg-white border-r border-gray-200 relative z-10"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-gray-100">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">AI 助手</span>
          </motion.div>
        )}
        <button onClick={onToggleCollapse}
          className={cn('p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer', collapsed && 'mx-auto')}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 text-gray-400" /> : <PanelLeftClose className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* 工具列表 */}
      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <Wrench className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">工具</span>
          </div>
          <div className="space-y-1">
            {tools.map(tool => {
              const Icon = getToolIcon(tool.icon);
              return (
                <div key={tool.id} className="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', tool.enabled ? 'text-gray-700' : 'text-gray-300')} />
                    <span className={cn('text-[13px]', tool.enabled ? 'text-gray-700' : 'text-gray-400')}>{tool.name}</span>
                  </div>
                  <ToggleSwitch enabled={tool.enabled} onChange={() => onToggleTool(tool.id)} label={tool.name} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 底部 */}
      <div className="border-t border-gray-100 px-2 py-2 space-y-0.5">
        {[
          { icon: Trash2, label: '清空对话', onClick: onClearChat, danger: true },
          { icon: Settings, label: '设置', onClick: onOpenSettings },
        ].map(({ icon: I, label, onClick, danger }) => (
          <button key={label} onClick={onClick}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors min-h-[36px] cursor-pointer',
              danger ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}>
            <I className="w-4 h-4" />
            {!collapsed && <span className="text-[13px]">{label}</span>}
          </button>
        ))}
      </div>
    </motion.aside>
  );
}
