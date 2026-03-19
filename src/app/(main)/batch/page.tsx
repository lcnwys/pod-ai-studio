'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import apiClient from '@/lib/api/client';
import type { BatchJob } from '@/lib/types';

const statusColors: Record<string, string> = {
  PENDING: 'status-pending',
  RUNNING: 'status-running',
  COMPLETED: 'status-success',
  PARTIAL_FAILED: 'status-failed',
};

export default function BatchPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['batchJobs'],
    queryFn: async () => {
      const res = await apiClient.get('/batch');
      return res.data;
    },
  });

  const batches: BatchJob[] = data?.data || [];

  return (
    <>
      <PageHeader
        title="批量中心"
        description="CSV/Excel 导入，批量生成设计图"
        actions={
          <Link href="/batch/new" className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            新建批量任务
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75" />
          </svg>
          <p className="text-gray-500">暂无批量任务</p>
          <Link href="/batch/new" className="btn-primary mt-4 text-sm inline-flex">创建第一个批量任务</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const percent = batch.totalCount > 0
              ? Math.round(((batch.successCount + batch.failedCount) / batch.totalCount) * 100)
              : 0;
            return (
              <Link key={batch.id} href={`/batch/${batch.id}`} className="glass-card-hover block p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-white">{batch.name || `批量任务 ${batch.id.slice(0, 8)}`}</span>
                    <span className="text-xs text-gray-500 ml-3">{batch.type}</span>
                  </div>
                  <span className={statusColors[batch.status] || 'status-pending'}>{batch.status}</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                  <div className="h-full flex">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(batch.successCount / Math.max(batch.totalCount, 1)) * 100}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${(batch.failedCount / Math.max(batch.totalCount, 1)) * 100}%` }} />
                    <div className="bg-indigo-500 transition-all" style={{ width: `${(batch.runningCount / Math.max(batch.totalCount, 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>总计 {batch.totalCount}</span>
                  <span className="text-emerald-400">成功 {batch.successCount}</span>
                  <span className="text-red-400">失败 {batch.failedCount}</span>
                  <span className="text-indigo-400">进行中 {batch.runningCount}</span>
                  <span className="ml-auto">{percent}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
