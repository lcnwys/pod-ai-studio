'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';
import { usePrint } from '@/lib/hooks/usePrint';
import { useTaskPolling } from '@/lib/hooks/useTaskPolling';
import type { JobStatus } from '@/lib/types';

const presets = [
  { label: 'T恤 (正面)', width: 4500, height: 5400, dpi: 300 },
  { label: '马克杯 (环绕)', width: 4200, height: 1800, dpi: 300 },
  { label: '海报 18×24"', width: 5400, height: 7200, dpi: 300 },
  { label: '手机壳', width: 1800, height: 3200, dpi: 300 },
  { label: '抱枕 16×16"', width: 4800, height: 4800, dpi: 300 },
  { label: '帆布包', width: 4200, height: 4200, dpi: 300 },
];

export default function PrintPage() {
  const [referenceImageId, setReferenceImageId] = useState('');
  const [dpi, setDpi] = useState(300);
  const [imageWidth, setImageWidth] = useState(4500);
  const [imageHeight, setImageHeight] = useState(5400);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const printMutation = usePrint();
  const taskQuery = useTaskPolling(currentJobId);

  const isLoading = printMutation.isPending ||
    (taskQuery.data && !['SUCCESS', 'FAILED'].includes(taskQuery.data.status));

  const handlePrint = async () => {
    if (!referenceImageId.trim()) return;
    try {
      const job = await printMutation.mutateAsync({
        referenceImageId,
        dpi,
        imageWidth,
        imageHeight,
      });
      setCurrentJobId(job.id);
    } catch (err) {
      console.error('Print failed:', err);
    }
  };

  const taskStatus = taskQuery.data?.status as JobStatus | undefined;
  const resultImageId = taskQuery.data?.result?.generateImageId;

  return (
    <>
      <PageHeader title="打印图生成" description="指定尺寸和 DPI，生成工厂可用的打印文件" />

      <div className="flex gap-6 items-start">
        <div className="w-[400px] shrink-0 space-y-5">
          <div className="glass-card p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">原图 Image ID</label>
              <input
                type="text"
                value={referenceImageId}
                onChange={(e) => setReferenceImageId(e.target.value)}
                placeholder="输入原图的 fileId"
                className="input-field"
              />
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">尺寸预设</label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { setImageWidth(p.width); setImageHeight(p.height); setDpi(p.dpi); }}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition-all
                      ${imageWidth === p.width && imageHeight === p.height
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                        : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <div className="font-medium">{p.label}</div>
                    <div className="text-gray-600 mt-0.5">{p.width}×{p.height} @ {p.dpi}dpi</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom size */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">宽度 (px)</label>
                <input type="number" value={imageWidth} onChange={(e) => setImageWidth(Number(e.target.value))} className="input-field text-center" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">高度 (px)</label>
                <input type="number" value={imageHeight} onChange={(e) => setImageHeight(Number(e.target.value))} className="input-field text-center" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">DPI</label>
                <input type="number" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} min={72} max={1200} className="input-field text-center" />
              </div>
            </div>

            <div className="text-xs text-gray-600 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              输出尺寸: {(imageWidth / dpi).toFixed(1)}″ × {(imageHeight / dpi).toFixed(1)}″ @ {dpi} DPI
            </div>

            <button
              onClick={handlePrint}
              disabled={!referenceImageId.trim() || isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 生成中...</>
              ) : (
                '生成打印图'
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="glass-card p-6">
            {taskStatus && (
              <div className="flex items-center justify-between mb-4">
                <TaskStatusBadge status={taskStatus} />
              </div>
            )}

            {resultImageId ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-emerald-400 font-medium">打印图已生成</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">Image ID: {resultImageId}</p>
                <p className="text-xs text-gray-500 mt-1">{imageWidth}×{imageHeight} px @ {dpi} DPI</p>
                <button className="btn-primary mt-4 text-sm">下载打印图</button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-400">打印图生成中...</p>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                <p className="text-sm">选择原图，配置打印参数</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
