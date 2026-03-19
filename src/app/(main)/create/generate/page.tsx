'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import PromptInput from '@/components/create/PromptInput';
import ImageUploader from '@/components/create/ImageUploader';
import AspectRatioSelector from '@/components/create/AspectRatioSelector';
import ResolutionSelector from '@/components/create/ResolutionSelector';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';
import { useGenerateImage } from '@/lib/hooks/useGenerateImage';
import { useTaskPolling } from '@/lib/hooks/useTaskPolling';
import { ASPECT_RATIOS } from '@/lib/types';
import type { JobStatus } from '@/lib/types';

interface UploadedImage {
  fileId: string;
  assetId: string;
  preview: string;
  name: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [refImages, setRefImages] = useState<UploadedImage[]>([]);
  const [aspectRatioId, setAspectRatioId] = useState(0);
  const [resolutionId, setResolutionId] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const generateMutation = useGenerateImage();
  const taskQuery = useTaskPolling(currentJobId);

  const currentAspect = ASPECT_RATIOS.find(r => r.id === aspectRatioId);
  const aspectStr = currentAspect ? `${currentAspect.w}/${currentAspect.h}` : '1/1';

  const isLoading = generateMutation.isPending ||
    (taskQuery.data && !['SUCCESS', 'FAILED'].includes(taskQuery.data.status));

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      const job = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        referenceImageIds: refImages.map(img => img.fileId),
        aspectRatioId,
        resolutionRatioId: resolutionId,
      });
      setCurrentJobId(job.id);
    } catch (err) {
      console.error('Generate failed:', err);
    }
  };

  const resultImageId = taskQuery.data?.result?.generateImageId;
  const taskStatus = taskQuery.data?.status as JobStatus | undefined;

  return (
    <>
      <PageHeader title="AI 生图" description="输入提示词和参考图，AI 为你生成设计图" />

      <div className="flex gap-6 items-start">
        {/* Left: Config Panel */}
        <div className="w-[400px] shrink-0 space-y-5">
          <div className="glass-card p-5 space-y-5">
            <PromptInput value={prompt} onChange={setPrompt} />
            <ImageUploader images={refImages} onChange={setRefImages} maxImages={6} />
            <AspectRatioSelector value={aspectRatioId} onChange={setAspectRatioId} />
            <ResolutionSelector value={resolutionId} onChange={setResolutionId} />

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  开始生成
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 min-w-0">
          <div className="glass-card p-6">
            {/* Status bar */}
            {taskStatus && (
              <div className="flex items-center justify-between mb-4">
                <TaskStatusBadge status={taskStatus} />
                {currentJobId && (
                  <span className="text-xs text-gray-600 font-mono">ID: {currentJobId.slice(0, 8)}...</span>
                )}
              </div>
            )}

            {/* Result display */}
            {isLoading ? (
              <LoadingSkeleton aspectRatio={aspectStr} />
            ) : resultImageId ? (
              <div>
                <div
                  className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06]"
                  style={{ aspectRatio: aspectStr }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-emerald-400 font-medium">生成完成</p>
                      <p className="text-xs text-gray-600 mt-1 font-mono">Image ID: {resultImageId}</p>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-2 mt-4">
                  <button className="btn-secondary text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    下载
                  </button>
                  <button className="btn-secondary text-xs" onClick={() => {/* TODO: navigate to fission */}}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                    </svg>
                    裂变
                  </button>
                  <button className="btn-secondary text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0" />
                    </svg>
                    打印图
                  </button>
                  <button className="btn-secondary text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    收藏
                  </button>
                </div>
              </div>
            ) : taskStatus === 'FAILED' ? (
              <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-8 text-center" style={{ aspectRatio: aspectStr }}>
                <svg className="w-12 h-12 mx-auto mb-3 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-400 font-medium">生成失败</p>
                <p className="text-xs text-gray-500 mt-1">{taskQuery.data?.error?.message || '未知错误'}</p>
                <button onClick={handleGenerate} className="btn-secondary mt-4 text-xs">重试</button>
              </div>
            ) : (
              <div
                className="rounded-2xl border-2 border-dashed border-white/[0.06] flex items-center justify-center"
                style={{ aspectRatio: aspectStr, minHeight: 300 }}
              >
                <div className="text-center text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                  <p className="text-sm">输入提示词，开始生成</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
