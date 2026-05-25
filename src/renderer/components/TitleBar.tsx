/**
 * 自定义标题栏组件
 *
 * Electron frame: false 窗口需要自定义标题栏：
 * - 可拖拽区域（-webkit-app-region: drag）
 * - 最小化 / 最大化 / 关闭按钮
 * - 与系统标题栏一致的交互体验
 */

import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  // 同步窗口最大化状态
  useEffect(() => {
    window.electronAPI?.windowIsMaximized().then(setIsMaximized);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center h-9 bg-surface border-b border-border select-none',
        'electron-drag' // CSS 类，标记为可拖拽区域
      )}
    >
      {/* ── 左侧标题 ── */}
      <div className="flex-1 pl-4">
        <span className="text-xs font-medium text-text-secondary">
          AI 编码助手
        </span>
      </div>

      {/* ── 右侧窗口控制按钮 ── */}
      <div className="flex items-center electron-no-drag">
        {/* 最小化 */}
        <button
          onClick={() => window.electronAPI?.windowMinimize()}
          className={cn(
            'flex items-center justify-center w-11 h-9',
            'hover:bg-surface-hover transition-colors duration-100'
          )}
          title="最小化"
          aria-label="最小化窗口"
        >
          <Minus className="w-4 h-4 text-text-secondary" />
        </button>

        {/* 最大化 / 还原 */}
        <button
          onClick={async () => {
            await window.electronAPI?.windowMaximize();
            const maximized = await window.electronAPI?.windowIsMaximized();
            setIsMaximized(maximized);
          }}
          className={cn(
            'flex items-center justify-center w-11 h-9',
            'hover:bg-surface-hover transition-colors duration-100'
          )}
          title={isMaximized ? '还原' : '最大化'}
          aria-label={isMaximized ? '还原窗口' : '最大化窗口'}
        >
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5 text-text-secondary" />
          ) : (
            <Square className="w-3.5 h-3.5 text-text-secondary" />
          )}
        </button>

        {/* 关闭 */}
        <button
          onClick={() => window.electronAPI?.windowClose()}
          className={cn(
            'flex items-center justify-center w-11 h-9',
            'hover:bg-error/90 hover:text-white transition-colors duration-100'
          )}
          title="关闭"
          aria-label="关闭窗口"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
