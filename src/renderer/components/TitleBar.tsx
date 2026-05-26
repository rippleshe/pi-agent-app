import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { isElectron } from '../lib/api';

export function TitleBar() {
  const [max, setMax] = useState(false);
  useEffect(() => { if (isElectron) window.electronAPI?.windowIsMaximized().then(setMax); }, []);
  if (!isElectron) return null;

  return (
    <div className="flex items-center h-9 bg-white border-b border-gray-200 select-none electron-drag">
      <div className="flex-1 pl-4"><span className="text-[11px] text-gray-400 font-medium">AI 编码助手</span></div>
      <div className="flex items-center electron-no-drag">
        {[
          { icon: Minus, fn: () => window.electronAPI?.windowMinimize(), l: '最小化' },
          { icon: max ? Copy : Square, fn: async () => { await window.electronAPI?.windowMaximize(); setMax(await window.electronAPI?.windowIsMaximized()); }, l: '最大化' },
          { icon: X, fn: () => window.electronAPI?.windowClose(), l: '关闭', danger: true },
        ].map(({ icon: I, fn, l, danger }) => (
          <button key={l} onClick={fn} aria-label={l}
            className={cn('flex items-center justify-center w-11 h-9 transition-colors cursor-pointer', danger ? 'hover:bg-red-50' : 'hover:bg-gray-100')}>
            <I className="w-3.5 h-3.5 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
