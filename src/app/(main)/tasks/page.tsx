'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';
import apiClient from '@/lib/api/client';
import type { Job, JobStatus, JobType } from '@/lib/types';

const typeLabels: Record<JobType, string> = {
  generate: 'AI 生图',
  fission: '图裂变',
  print: '打印图',
  extract: '印花提取',
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { status: statusFilter, type: typeFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');
      const res = await apiClient.get(`/jobs?${params}`);
      return res.data;
    },
  });

  const jobs: Job[] = data?.data || [];
  const total = data?.total || 0;

  const handleRetry = async (jobId: string) => {
    setRetrying(prev => new Set(prev).add(jobId));
    try {
      await apiClient.post(`/jobs/${jobId}`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (err: any) {
      alert(err.response?.data?.error || '重试失败');
    } finally {
      setRetrying(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      // Find the asset associated with this job
      const res = await apiClient.get(`/jobs/${jobId}`);
      const job = res.data;
      if (job.result?.generateImageId) {
        // Get download URL via asset
        const assetsRes = await apiClient.get('/assets', { params: { pageSize: 100 } });
        const asset = (assetsRes.data.data || []).find((a: any) => a.jobId === jobId);
        if (asset) {
          const dlRes = await apiClient.get(`/assets/${asset.id}/download`);
          if (dlRes.data.url) {
            window.open(dlRes.data.url, '_blank');
            return;
          }
        }
      }
      alert('暂无可下载文件');
    } catch {
      alert('获取下载链接失败');
    }
  };

  return (
    <>
      <PageHeader title="任务历史" description={`共 ${total} 个任务`} />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input-field w-40"
        >
          <option value="">全部类型</option>
          <option value="generate">AI 生图</option>
          <option value="fission">图裂变</option>
          <option value="print">打印图</option>
          <option value="extract">印花提取</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-40"
        >
          <option value="">全部状态</option>
          <option value="PENDING">排队中</option>
          <option value="SUBMITTED">已提交</option>
          <option value="PROCESSING">处理中</option>
          <option value="SUCCESS">已完成</option>
          <option value="FAILED">失败</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">任务 ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">描述</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">费用</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td colSpan={7} className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-600">暂无任务</td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{job.id.slice(0, 8)}...</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {typeLabels[job.type] || job.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 max-w-[200px] truncate">
                      {(job.params as any)?.prompt?.slice(0, 40) || '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <TaskStatusBadge status={job.status as JobStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {job.cost != null ? `¥${Number(job.cost).toFixed(4)}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {job.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={retrying.has(job.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                          >
                            {retrying.has(job.id) ? '重试中...' : '重试'}
                          </button>
                        )}
                        {job.status === 'SUCCESS' && (
                          <button
                            onClick={() => handleDownload(job.id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                          >
                            下载
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">共 {total} 条</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-30">上一页</button>
              <span className="text-xs text-gray-500 px-2 py-1">{page} / {Math.ceil(total / 20)}</span>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-30">下一页</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
