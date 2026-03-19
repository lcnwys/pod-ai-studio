'use client';

import { RESOLUTIONS } from '@/lib/types';

interface ResolutionSelectorProps {
  value: number;
  onChange: (id: number) => void;
}

export default function ResolutionSelector({ value, onChange }: ResolutionSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">分辨率</label>
      <div className="flex gap-2">
        {RESOLUTIONS.map((res) => {
          const isActive = value === res.id;
          return (
            <button
              key={res.id}
              type="button"
              onClick={() => onChange(res.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${isActive
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                }
              `}
            >
              {res.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
