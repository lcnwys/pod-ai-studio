'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import AspectRatioSelector from '@/components/create/AspectRatioSelector';
import ResolutionSelector from '@/components/create/ResolutionSelector';
import SimilaritySlider from '@/components/create/SimilaritySlider';
import PromptInput from '@/components/create/PromptInput';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';
import { useFission } from '@/lib/hooks/useFission';
import { useTaskPolling } from '@/lib/hooks/useTaskPolling';
import type { JobStatus } from '@/lib/types';

export default function FissionPage() {
  const [referenceImageId, setReferenceImageId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [similarity, setSimilarity] = useState(0.7);
  const [aspectRatio, setAspectRatio] = useState(0);
  const [resolutionId, setResolutionId] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const fissionMutation = useFission();
  const taskQuery = useTaskPolling(currentJobId);

  const isLoading = fissionMutation.isPending ||
    (taskQuery.data && !['SUCCESS', 'FAILED'].includes(taskQuery.data.status));

  const handleFission = async () => {
    if (!referenceImageId.trim()) return;
    try {
      const job = await fissionMutation.mutateAsync({
        referenceImageId,
        prompt: prompt || undefined,
        similarity,
        resolutionRatioId: resolutionId,
        aspectRatio,
      });
      setCurrentJobId(job.id);
    } catch (err) {
      console.error('Fission failed:', err);
    }
  };

  const taskStatus = taskQuery.data?.status as JobStatus | undefined;
  const resultImageId = taskQuery.data?.result?.generateImageId;

  return (
    <>
      <PageHeader title="图裂变" description="基于一张原图，生成多个风格变体" />

      <div className="flex gap-6 items-start">
        <div className="w-[400px] shrink-0 space-y-5">
          <div className="glass-card p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">原图 Image ID</label>
              <input
                type="text"
                value={referenceImageId}
                onChange={(e) => setReferenceImageId(e.target.value)}
                placeholder="输入原图的 fileId 或从素材库选择"
                className="input-field"
              />
              <p className="text-xs text-gray-600">可从素材库复制 Image ID，或上传新图获取</p>
            </div>

            <PromptInput value={prompt} onChange={setPrompt} placeholder="可选：描述希望的风格方向..." />
            <SimilaritySlider value={similarity} onChange={setSimilarity} />
            <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
            <ResolutionSelector value={resolutionId} onChange={setResolutionId} />

            <button
              onClick={handleFission}
              disabled={!referenceImageId.trim() || isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  裂变中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                  </svg>
                  开始裂变
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="glass-card p-6">
            {taskStatus && (
              <div className="flex items-center justify-between mb-4">
                <TaskStatusBadge status={taskStatus} />
                {currentJobId && <span className="text-xs text-gray-600 font-mono">ID: {currentJobId.slice(0, 8)}...</span>}
              </div>
            )}

            {resultImageId ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-emerald-400 font-medium">裂变完成</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">Image ID: {resultImageId}</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button className="btn-secondary text-xs">下载</button>
                  <button className="btn-secondary text-xs">生成打印图</button>
                  <button className="btn-secondary text-xs">收藏</button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-400">裂变生成中...</p>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <p className="text-sm">选择原图，开始裂变</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
