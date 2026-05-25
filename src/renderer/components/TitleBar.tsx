import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { isElectron } from '../lib/api';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  useEffect(() => {
    if (isElectron) window.electronAPI?.windowIsMaximized().then(setIsMaximized);
  }, []);

  if (!isElectron) return null;

  return (
    <div className="flex items-center h-10 bg-white border-b border-border select-none electron-drag">
      <div className="flex-1 pl-4">
        <span className="text-xs font-medium text-text-muted tracking-wide">AI 编码助手</span>
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
          <button key={label} onClick={action}
            className={cn('flex items-center justify-center w-11 h-10 transition-colors', danger ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-gray-100')}
            aria-label={label}
          >
            <Icon className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
