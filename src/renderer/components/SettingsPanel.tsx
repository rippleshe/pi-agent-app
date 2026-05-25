/**
 * 设置面板 — 清新典雅风格
 *
 * 模态弹窗，Spring 弹跳动画，点击遮罩关闭
 */

import { motion } from 'framer-motion';
import { X, Wrench, Leaf } from 'lucide-react';
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
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label="设置"
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
        className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-border/30"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
          <h2 className="text-sm font-medium text-text-primary">设置</h2>
          <button onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-hover transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* 工具配置 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-3 h-3 text-text-muted" />
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.1em]">工具配置</h3>
            </div>
            <div className="space-y-1.5">
              {tools.map(tool => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'p-1.5 rounded-md',
                        tool.enabled ? 'bg-primary/[0.06] text-primary' : 'bg-border/30 text-text-muted'
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] text-text-primary">{tool.name}</span>
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
          </section>

          {/* 关于 */}
          <section className="pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-3 h-3 text-primary/50" />
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.1em]">关于</span>
            </div>
            <div className="space-y-1 text-[12px] text-text-muted leading-relaxed">
              <p className="font-medium text-text-secondary">AI 编码助手 v1.0.0</p>
              <p>Pi-Agent SDK + DeepSeek V4 Flash</p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
