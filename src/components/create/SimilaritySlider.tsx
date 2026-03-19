'use client';

interface SimilaritySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function SimilaritySlider({ value, onChange }: SimilaritySliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">相似度</label>
        <span className="text-sm font-mono text-indigo-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min="0.01"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.1]
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>差异大</span>
        <span>极相似</span>
      </div>
    </div>
  );
}
