import { motion } from 'framer-motion';
import { X, Wrench, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { getToolIcon } from '../lib/icons';
import { ToolConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';

interface Props { tools: ToolConfig[]; onToggleTool: (id: string) => void; onClose: () => void; }

export function SettingsPanel({ tools, onToggleTool, onClose }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="设置"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-900">设置</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer" aria-label="关闭">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Wrench className="w-3.5 h-3.5 text-gray-400" />
              <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">工具配置</h3>
            </div>
            <div className="space-y-1.5">
              {tools.map(tool => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-4 h-4', tool.enabled ? 'text-gray-700' : 'text-gray-300')} />
                      <span className="text-[13px] text-gray-700">{tool.name}</span>
                    </div>
                    <ToggleSwitch enabled={tool.enabled} onChange={() => onToggleTool(tool.id)} label={tool.name} />
                  </div>
                );
              })}
            </div>
          </section>
          <section className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">关于</span>
            </div>
            <div className="text-[13px] text-gray-500 space-y-0.5">
              <p className="font-medium text-gray-700">AI 编码助手 v1.0.0</p>
              <p>Pi-Agent SDK + DeepSeek V4 Flash</p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
