import { cn } from '../lib/utils';

interface Props {
  enabled: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}

export function ToggleSwitch({ enabled, onChange, label, className }: Props) {
  return (
    <button onClick={onChange}
      className={cn(
        'relative inline-flex items-center h-[22px] w-[38px] rounded-full transition-colors duration-200 cursor-pointer',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
        enabled ? 'bg-emerald-500' : 'bg-slate-200',
        className
      )}
      role="switch" aria-checked={enabled} aria-label={label}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200',
        enabled ? 'translate-x-[19px]' : 'translate-x-[3px]'
      )} />
    </button>
  );
}
