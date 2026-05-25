/**
 * 设置面板组件（模态弹窗）
 *
 * 【模态弹窗的实现模式】
 * 1. 遮罩层：半透明黑色背景，覆盖整个屏幕
 * 2. 内容面板：居中显示，有白色背景和圆角
 * 3. 点击遮罩关闭（e.stopPropagation 阻止内容区的点击冒泡到遮罩）
 *
 * 【e.stopPropagation()】
 * 事件冒泡：子元素的点击事件会"冒泡"到父元素。
 * 如果不阻止，点击面板内容也会触发遮罩的 onClick（关闭面板）。
 * stopPropagation 阻止了这个冒泡。
 */

import { motion } from 'framer-motion';
import { X, Wrench } from 'lucide-react';
import { cn } from '../lib/utils';
import { getToolIcon } from '../lib/icons';
import { ToolConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';

interface SettingsPanelProps {
  tools: ToolConfig[];
  onToggleTool: (toolId: string) => void;
  onClose: () => void;
}

export function SettingsPanel({ tools, onToggleTool, onClose }: SettingsPanelProps) {
  return (
    /**
     * 【fixed inset-0】
     * position: fixed（相对于浏览器窗口定位，不随页面滚动）
     * inset: 0 = top: 0; right: 0; bottom: 0; left: 0（占满整个屏幕）
     *
     * 【backdrop-blur-sm】
     * 背景模糊效果（毛玻璃），让遮罩后面的内容变模糊。
     *
     * 【z-50】
     * z-index: 50，确保弹窗在最上层，覆盖其他所有内容。
     */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose} // 点击遮罩关闭
      role="dialog"     // 无障碍：告诉屏幕阅读器这是对话框
      aria-modal="true" // 无障碍：模态对话框
      aria-label="设置面板"
    >
      {/* 内容面板 */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        // 【Spring 弹簧动画】
        // type: 'spring' 模拟弹簧物理效果，比线性过渡更有弹性。
        // 适合弹窗出现的动画（先稍微弹过头，再回弹到正确位置）。
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
        onClick={(e) => e.stopPropagation()} // 阻止点击内容区触发关闭
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
            aria-label="关闭设置面板"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">

          {/* 工具配置区 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-medium text-text-secondary">工具配置</h3>
            </div>

            <div className="space-y-2">
              {tools.map((tool) => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg transition-colors duration-200',
                        tool.enabled ? 'bg-primary/10 text-primary' : 'bg-border/50 text-text-muted'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-text-primary">{tool.name}</span>
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

          {/* 关于信息 */}
          <section className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-text-secondary mb-3">关于</h3>
            <div className="space-y-1.5 text-sm text-text-muted">
              <p className="font-medium text-text-secondary">AI 编码助手 v1.0.0</p>
              <p>基于 Pi-Agent + DeepSeek V4 Flash</p>
              <p>支持文件读取、命令执行、代码搜索等功能</p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
