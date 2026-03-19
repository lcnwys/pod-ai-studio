'use client';

import { ASPECT_RATIOS } from '@/lib/types';

interface AspectRatioSelectorProps {
  value: number;
  onChange: (id: number) => void;
}

export default function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">画面比例</label>
      <div className="grid grid-cols-4 gap-2">
        {ASPECT_RATIOS.map((ratio) => {
          const isActive = value === ratio.id;
          const maxDim = 28;
          const scale = maxDim / Math.max(ratio.w, ratio.h);
          const w = Math.round(ratio.w * scale);
          const h = Math.round(ratio.h * scale);

          return (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onChange(ratio.id)}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all
                ${isActive
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                }
              `}
            >
              <div
                className={`border-2 rounded-sm ${isActive ? 'border-indigo-400' : 'border-gray-600'}`}
                style={{ width: w, height: h }}
              />
              <span className="text-[10px] font-medium">{ratio.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
