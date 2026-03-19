'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';
import apiClient from '@/lib/api/client';

const typeLabels: Record<string, string> = {
  generate: 'AI 生图',
  fission: '图裂变',
  print: '打印图',
  extract: '印花提取',
};

const statusLabels: Record<string, string> = {
  PENDING: '排队中',
  RUNNING: '运行中',
  COMPLETED: '已完成',
  PARTIAL_FAILED: '部分失败',
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['batchJob', id, page],
    queryFn: async () => {
      const res = await apiClient.get(`/batch/${id}`, { params: { page, pageSize: 50 } });
      return res.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.batch?.status;
      if (status === 'COMPLETED' || status === 'PARTIAL_FAILED') return false;
      return 5000;
    },
  });

  const batch = data?.batch;
  const items = data?.items?.data || [];
  const totalItems = data?.items?.total || 0;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await apiClient.post(`/batch/${id}`);
      queryClient.invalidateQueries({ queryKey: ['batchJob', id] });
      queryClient.invalidateQueries({ queryKey: ['batchJobs'] });
    } catch (err: any) {
      alert(err.response?.data?.error || '重试失败');
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="批量任务详情" description="加载中..." />
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!batch) {
    return (
      <>
        <PageHeader title="批量任务详情" description="" />
        <div className="glass-card p-12 text-center text-gray-500">未找到该批量任务</div>
      </>
    );
  }

  const percent = batch.totalCount > 0
    ? Math.round(((batch.successCount + batch.failedCount) / batch.totalCount) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title={batch.name || `批量任务 ${batch.id.slice(0, 8)}`}
        description={`${typeLabels[batch.type] || batch.type} · ${statusLabels[batch.status] || batch.status}`}
        actions={
          <div className="flex gap-2">
            {(batch.status === 'PARTIAL_FAILED') && (
              <button onClick={handleRetry} disabled={retrying} className="btn-primary text-sm disabled:opacity-50">
                {retrying ? '重试中...' : `重试失败项 (${batch.failedCount})`}
              </button>
            )}
            <Link href="/batch" className="btn-secondary text-sm">返回列表</Link>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-xs text-gray-500">总数</div>
          <div className="text-xl font-bold text-white mt-1">{batch.totalCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-gray-500">成功</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{batch.successCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-gray-500">失败</div>
          <div className="text-xl font-bold text-red-400 mt-1">{batch.failedCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-gray-500">进行中</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{batch.runningCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-gray-500">进度</div>
          <div className="text-xl font-bold text-white mt-1">{percent}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden mb-6">
        <div className="h-full flex">
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(batch.successCount / Math.max(batch.totalCount, 1)) * 100}%` }} />
          <div className="bg-red-500 transition-all duration-500" style={{ width: `${(batch.failedCount / Math.max(batch.totalCount, 1)) * 100}%` }} />
          <div className="bg-indigo-500 transition-all duration-500" style={{ width: `${(batch.runningCount / Math.max(batch.totalCount, 1)) * 100}%` }} />
        </div>
      </div>

      {/* Items table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">#</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">状态</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">参数</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">结果</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs text-gray-500">{item.rowIndex + 1}</td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[300px] truncate font-mono">
                    {(item.params as any)?.prompt?.slice(0, 60) || JSON.stringify(item.params).slice(0, 60)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {item.status === 'SUCCESS' && item.result ? (
                      <span className="text-emerald-400">完成</span>
                    ) : item.status === 'FAILED' && item.error ? (
                      <span className="text-red-400">{(item.error as any)?.message || '失败'}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalItems > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">共 {totalItems} 条</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-30">上一页</button>
              <span className="text-xs text-gray-500 px-2 py-1">{page}</span>
              <button disabled={page >= Math.ceil(totalItems / 50)} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-30">下一页</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
