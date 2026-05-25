/**
 * 自定义标题栏组件
 *
 * 【为什么需要这个组件？】
 * Electron 主进程设置了 frame: false（无边框窗口），
 * 系统自带的标题栏（包含关闭/最小化/最大化按钮）就没了。
 * 我们需要自己实现一个，否则用户无法拖动或关闭窗口。
 *
 * 【关键 CSS：-webkit-app-region】
 * - drag: 标记为可拖拽区域（用户可以按住这里拖动窗口）
 * - no-drag: 标记为不可拖拽（按钮区域，否则点按钮会拖动窗口）
 *
 * 这些类定义在 index.css 中：.electron-drag 和 .electron-no-drag
 */

import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

export function TitleBar() {
  // 窗口是否处于最大化状态（控制按钮图标切换）
  const [isMaximized, setIsMaximized] = useState(false);

  /**
   * 【useEffect 同步外部状态】
   * 窗口最大化状态是由主进程管理的（用户双击标题栏、拖到屏幕边缘等）。
   * 我们在组件挂载时查询一次初始状态。
   * 后续通过按钮点击时更新。
   */
  useEffect(() => {
    window.electronAPI?.windowIsMaximized().then(setIsMaximized);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center h-9 bg-surface border-b border-border select-none',
        'electron-drag' // 整个标题栏可拖拽
      )}
    >
      {/* 左侧标题文字 */}
      <div className="flex-1 pl-4">
        <span className="text-xs font-medium text-text-secondary">AI 编码助手</span>
      </div>

      {/* 右侧窗口控制按钮 */}
      {/* electron-no-drag: 按钮区域不可拖拽，否则点击按钮会变成拖动窗口 */}
      <div className="flex items-center electron-no-drag">

        {/* 最小化按钮 */}
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

        {/* 最大化/还原按钮 */}
        <button
          onClick={async () => {
            await window.electronAPI?.windowMaximize();
            // 更新本地状态（切换图标）
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
          {/* 最大化时显示"层叠"图标，未最大化时显示"方框"图标 */}
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5 text-text-secondary" />
          ) : (
            <Square className="w-3.5 h-3.5 text-text-secondary" />
          )}
        </button>

        {/* 关闭按钮 */}
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
