import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { isElectron } from '../lib/api';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isElectron) {
      window.electronAPI?.windowIsMaximized().then(setIsMaximized);
    }
  }, []);

  // 浏览器模式下不显示标题栏
  if (!isElectron) return null;

  return (
    <div className={cn(
      'flex items-center h-9 bg-surface/60 backdrop-blur-md border-b border-border/50 select-none electron-drag'
    )}>
      <div className="flex-1 pl-4">
        <span className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
          AI Assistant
        </span>
      </div>
      <div className="flex items-center electron-no-drag">
        {[
          { icon: Minus, action: () => window.electronAPI?.windowMinimize(), label: '最小化' },
          { icon: isMaximized ? Copy : Square, action: async () => {
            await window.electronAPI?.windowMaximize();
            setIsMaximized(await window.electronAPI?.windowIsMaximized());
          }, label: isMaximized ? '还原' : '最大化' },
          { icon: X, action: () => window.electronAPI?.windowClose(), label: '关闭', danger: true },
        ].map(({ icon: Icon, action, label, danger }) => (
          <button
            key={label}
            onClick={action}
            className={cn(
              'flex items-center justify-center w-11 h-9 transition-colors duration-100',
              danger ? 'hover:bg-error/10 hover:text-error' : 'hover:bg-surface-hover'
            )}
            title={label}
            aria-label={label}
          >
            <Icon className="w-3.5 h-3.5 text-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
