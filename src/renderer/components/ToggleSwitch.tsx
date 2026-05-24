/**
 * 切换开关组件
 * 
 * 用于启用/禁用功能的无障碍切换开关
 * 遵循 UI/UX Pro Max 设计规范：
 * - role="switch" + aria-checked 无障碍支持
 * - 触摸目标 ≥44px（通过外层按钮扩展）
 * - focus-visible 焦点环
 */

import { cn } from '../lib/utils';

interface ToggleSwitchProps {
  /** 是否启用 */
  enabled: boolean;
  /** 切换回调 */
  onChange: () => void;
  /** 无障碍标签 */
  label: string;
  /** 自定义类名 */
  className?: string;
}

export function ToggleSwitch({ enabled, onChange, label, className }: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'relative inline-flex items-center',
        'h-6 w-11 rounded-full',
        'transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        enabled ? 'bg-primary' : 'bg-border',
        className
      )}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
