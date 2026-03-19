'use client';

import { useState } from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const promptTemplates = [
  'A cute cartoon [animal] with [style] style, suitable for t-shirt print',
  'Vintage retro [subject] illustration, distressed texture, POD ready',
  'Minimalist line art of [subject], single color, transparent background',
  'Watercolor [flower/plant] pattern, seamless tile, pastel colors',
  'Bold typography "[text]" with decorative elements, poster style',
];

export default function PromptInput({ value, onChange, placeholder, maxLength = 2000 }: PromptInputProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">提示词 Prompt</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {showTemplates ? '收起模板' : '提示词模板'}
          </button>
          <span className="text-xs text-gray-600">{value.length}/{maxLength}</span>
        </div>
      </div>

      {showTemplates && (
        <div className="grid gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          {promptTemplates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(tpl); setShowTemplates(false); }}
              className="text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] px-2.5 py-1.5 rounded-lg transition-colors truncate"
            >
              {tpl}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder || '描述你想要生成的设计图...'}
        rows={4}
        className="textarea-field"
      />
    </div>
  );
}
