import { motion } from 'framer-motion';
import { X, Wrench, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { getToolIcon } from '../lib/icons';
import { ToolConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';

interface Props {
  tools: ToolConfig[];
  onToggleTool: (toolId: string) => void;
  onClose: () => void;
}

export function SettingsPanel({ tools, onToggleTool, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label="设置"
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 8 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">设置</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-5 space-y-6 max-h-[60vh] overflow-y-auto">

          {/* 工具配置 */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Wrench className="w-3.5 h-3.5 text-gray-400" />
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">工具配置</h3>
            </div>
            <div className="space-y-2">
              {tools.map(tool => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        tool.enabled ? 'bg-sky-50 text-sky-500' : 'bg-gray-100 text-gray-400'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-700">{tool.name}</span>
                    </div>
                    <ToggleSwitch enabled={tool.enabled} onChange={() => onToggleTool(tool.id)} label={tool.name} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* 关于 */}
          <section className="pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">关于</span>
            </div>
            <div className="space-y-1 text-sm text-gray-400">
              <p className="font-medium text-gray-600">AI 编码助手 v1.0.0</p>
              <p>Pi-Agent SDK + DeepSeek V4 Flash</p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
