/**
 * 切换开关组件
 *
 * 【无障碍设计 (Accessibility, a11y)】
 * 这个组件遵循 WAI-ARIA 规范：
 * - role="switch"：告诉屏幕阅读器"这是一个开关"
 * - aria-checked：告诉屏幕阅读器当前状态（开/关）
 * - aria-label：语音播报的文本
 * - focus-visible：键盘 Tab 聚焦时显示焦点环
 *
 * 这些属性对视觉用户没有影响，
 * 但对使用屏幕阅读器的视障用户至关重要。
 */

import { cn } from '../lib/utils';

interface ToggleSwitchProps {
  enabled: boolean;     // 当前是否启用
  onChange: () => void;  // 切换时的回调
  label: string;        // 无障碍标签（屏幕阅读器会读）
  className?: string;   // 可选的额外 CSS 类
}

export function ToggleSwitch({ enabled, onChange, label, className }: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      className={cn(
        // 基础布局
        'relative inline-flex items-center',
        'h-6 w-11 rounded-full',
        'transition-colors duration-200',
        // 键盘聚焦时的焦点环（focus-visible 只在键盘导航时触发，鼠标点击不触发）
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        // 根据状态切换背景色
        enabled ? 'bg-primary' : 'bg-border',
        className
      )}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      {/* 圆形滑块 */}
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          // 【translate-x 控制滑块位置】
          // translate-x-6 = 向右移动 1.5rem（24px）→ 右侧（开启）
          // translate-x-1 = 向右移动 0.25rem（4px）→ 左侧（关闭）
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
