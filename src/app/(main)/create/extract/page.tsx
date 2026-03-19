'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import PromptInput from '@/components/create/PromptInput';
import ResolutionSelector from '@/components/create/ResolutionSelector';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';
import { useExtract } from '@/lib/hooks/useExtract';
import { useTaskPolling } from '@/lib/hooks/useTaskPolling';
import type { JobStatus } from '@/lib/types';

export default function ExtractPage() {
  const [referenceImageId, setReferenceImageId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [resolutionId, setResolutionId] = useState(0);
  const [isPatternCompleted, setIsPatternCompleted] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const extractMutation = useExtract();
  const taskQuery = useTaskPolling(currentJobId);

  const isLoading = extractMutation.isPending ||
    (taskQuery.data && !['SUCCESS', 'FAILED'].includes(taskQuery.data.status));

  const handleExtract = async () => {
    if (!referenceImageId.trim()) return;
    try {
      const job = await extractMutation.mutateAsync({
        referenceImageId,
        prompt: prompt || undefined,
        resolutionRatioId: resolutionId,
        isPatternCompleted,
      });
      setCurrentJobId(job.id);
    } catch (err) {
      console.error('Extract failed:', err);
    }
  };

  const taskStatus = taskQuery.data?.status as JobStatus | undefined;
  const resultImageId = taskQuery.data?.result?.generateImageId;

  return (
    <>
      <PageHeader title="印花提取" description="从复杂图中提取可复用的印花元素" />

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

            <PromptInput value={prompt} onChange={setPrompt} placeholder="可选：描述需要提取的元素..." />
            <ResolutionSelector value={resolutionId} onChange={setResolutionId} />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">印花是否完整</label>
              <div className="flex gap-2">
                {[
                  { value: 0, label: '否 - 需要 AI 补全' },
                  { value: 1, label: '是 - 直接提取' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIsPatternCompleted(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all
                      ${isPatternCompleted === opt.value
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-white/[0.06] bg-white/[0.02] text-gray-500 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExtract}
              disabled={!referenceImageId.trim() || isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 提取中...</>
              ) : (
                '开始提取'
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
                <p className="text-emerald-400 font-medium">印花提取完成</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">Image ID: {resultImageId}</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button className="btn-secondary text-xs">下载</button>
                  <button className="btn-secondary text-xs">裂变</button>
                  <button className="btn-secondary text-xs">打印图</button>
                  <button className="btn-secondary text-xs">收藏</button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-400">印花提取中...</p>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024" />
                </svg>
                <p className="text-sm">上传复杂图，提取印花元素</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
