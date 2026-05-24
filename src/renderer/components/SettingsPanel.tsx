/**
 * 设置面板组件
 * 
 * 功能：
 * - 工具配置
 * - 模型选择
 * - 其他设置项
 */

import { motion } from 'framer-motion';
import { X, Wrench, FileText, Terminal, Search, FolderOpen, List } from 'lucide-react';
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

interface SettingsPanelProps {
  /** 工具列表 */
  tools: ToolConfig[];
  /** 切换工具状态 */
  onToggleTool: (toolId: string) => void;
  /** 关闭面板 */
  onClose: () => void;
}

export function SettingsPanel({ tools, onToggleTool, onClose }: SettingsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 面板头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* 面板内容 */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* 工具配置 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-text-muted" />
              <h3 className="text-sm font-medium text-text-secondary">工具配置</h3>
            </div>
            
            <div className="space-y-3">
              {tools.map((tool) => {
                const Icon = TOOL_ICONS[tool.icon] || Wrench;
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        tool.enabled ? 'bg-primary/10 text-primary' : 'bg-border text-text-muted'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-text-primary">{tool.name}</span>
                    </div>
                    
                    <button
                      onClick={() => onToggleTool(tool.id)}
                      className={cn(
                        'w-11 h-6 rounded-full relative transition-colors',
                        tool.enabled ? 'bg-primary' : 'bg-border'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          tool.enabled ? 'left-6' : 'left-1'
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 关于信息 */}
          <section className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-text-secondary mb-3">关于</h3>
            <div className="space-y-2 text-sm text-text-muted">
              <p>AI 编码助手 v1.0.0</p>
              <p>基于 Pi-Agent + DeepSeek V4 Flash</p>
              <p>支持文件读取、命令执行、代码搜索等功能</p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
