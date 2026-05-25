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
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="设置"
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">设置</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" aria-label="关闭">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">工具配置</h3>
            </div>
            <div className="space-y-2">
              {tools.map(tool => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', tool.enabled ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400')}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-slate-700">{tool.name}</span>
                    </div>
                    <ToggleSwitch enabled={tool.enabled} onChange={() => onToggleTool(tool.id)} label={tool.name} />
                  </div>
                );
              })}
            </div>
          </section>
          <section className="pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">关于</span>
            </div>
            <div className="space-y-1 text-sm text-slate-500">
              <p className="font-medium text-slate-700">AI 编码助手 v1.0.0</p>
              <p>Pi-Agent SDK + DeepSeek V4 Flash</p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
