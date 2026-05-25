/**
 * 侧边栏组件
 *
 * 展示：应用标题、工具开关列表、清空对话/设置按钮
 * 支持折叠/展开（宽度动画由 Framer Motion 驱动）
 */

import { motion } from 'framer-motion';
import {
  Bot, Settings, Trash2, PanelLeftClose, PanelLeftOpen, Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getToolIcon } from '../lib/icons';
import { ToolConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';

/**
 * Props 接口
 *
 * 【函数类型的写法】
 * onToggleCollapse: () => void
 * ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 * 这是一个"函数类型"：没有参数，返回 void（无返回值）
 *
 * onToggleTool: (toolId: string) => void
 * ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 * 有一个 string 参数，返回 void
 *
 * 把函数作为 prop 传递是 React 的核心模式：
 * 子组件通过调用父组件传来的函数来"通知"父组件发生了什么事。
 */
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  tools: ToolConfig[];
  onToggleTool: (toolId: string) => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onClearChat,
  onOpenSettings,
  tools,
  onToggleTool,
}: SidebarProps) {
  return (
    /**
     * 【motion.aside】
     * Framer Motion 的组件，aside 是 HTML5 语义标签（侧边栏）。
     * initial={false} 表示不做初始动画（直接显示最终状态）。
     * animate={{ width: ... }} 当 width 值变化时，自动播放过渡动画。
     *
     * transition 中的 ease: 'easeInOut' 是缓动函数：
     * 开始慢 → 中间快 → 结束慢，比线性过渡更自然。
     */
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'flex flex-col bg-surface border-r border-border',
        'shadow-sm relative z-10'
      )}
    >
      {/* ── 顶部标题区 ── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        {/* 折叠时隐藏标题文字 */}
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary text-sm truncate">AI 编码助手</span>
          </motion.div>
        )}
        {/* 折叠/展开按钮 */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          // 【aria-label】无障碍标签，屏幕阅读器会读出来
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 text-text-secondary" /> : <PanelLeftClose className="w-4 h-4 text-text-secondary" />}
        </button>
      </div>

      {/* ── 工具列表（展开时显示） ── */}
      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Wrench className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">可用工具</span>
          </div>

          <div className="space-y-1">
            {/**
             * 【map 渲染列表】
             * tools.map(tool => ...) 把每个工具对象转换为一段 JSX。
             * React 会把这些 JSX 渲染成真实的 DOM 元素。
             *
             * 【动态图标组件】
             * const Icon = getToolIcon(tool.icon)
             * 从映射表中获取图标组件，然后 <Icon /> 使用它。
             * 组件名首字母必须大写（Icon 而不是 icon），
             * 因为 React 用大小写来区分"组件"和"HTML 标签"。
             */}
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.icon);
              return (
                <div
                  key={tool.id}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    'transition-colors duration-200',
                    tool.enabled ? 'bg-primary/5' : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn('w-4 h-4 flex-shrink-0', tool.enabled ? 'text-primary' : 'text-text-muted')} />
                    <span className={cn('text-sm truncate', tool.enabled ? 'text-text-primary' : 'text-text-muted')}>
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

      {/* ── 底部操作按钮 ── */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <button
          onClick={onClearChat}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-error hover:bg-error/10 transition-colors duration-200',
            'min-h-[44px]' // 【触摸目标最小 44px】移动端友好
          )}
          title="清空对话"
          aria-label="清空当前对话"
        >
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">清空对话</span>}
        </button>

        <button
          onClick={onOpenSettings}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-text-secondary hover:bg-surface-hover transition-colors duration-200',
            'min-h-[44px]'
          )}
          title="设置"
          aria-label="打开设置面板"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">设置</span>}
        </button>
      </div>
    </motion.aside>
  );
}
