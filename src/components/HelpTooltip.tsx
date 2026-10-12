import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, position = 'top' }) => {
  const posClasses =
    position === 'bottom'
      ? 'top-full mt-2 left-1/2 -translate-x-1/2'
      : position === 'left'
      ? 'right-full mr-2 top-1/2 -translate-y-1/2'
      : position === 'right'
      ? 'left-full ml-2 top-1/2 -translate-y-1/2'
      : 'bottom-full mb-2 left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex items-center group cursor-help align-middle ml-1">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-[#00D2B4] transition-colors shrink-0" />
      <span
        role="tooltip"
        className={`pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute z-50 w-64 p-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-normal leading-relaxed shadow-xl border border-slate-700 text-left normal-case tracking-normal ${posClasses}`}
      >
        {text}
      </span>
    </span>
  );
};
