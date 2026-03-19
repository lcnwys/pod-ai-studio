'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import PageHeader from '@/components/layout/PageHeader';
import TaskStatusBadge from '@/components/shared/TaskStatusBadge';

const quickActions = [
  {
    title: 'AI 生图',
    desc: '文本描述 + 参考图生成设计',
    href: '/create/generate',
    gradient: 'from-indigo-500 to-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: '图裂变',
    desc: '一张图裂变为多个风格变体',
    href: '/create/fission',
    gradient: 'from-purple-500 to-pink-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: '打印图',
    desc: '生成工厂可用的打印文件',
    href: '/create/print',
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
    ),
  },
  {
    title: '印花提取',
    desc: '从复杂图中提取可复用元素',
    href: '/create/extract',
    gradient: 'from-orange-500 to-amber-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
      </svg>
    ),
  },
  {
    title: '批量任务',
    desc: 'CSV 导入批量生成',
    href: '/batch/new',
    gradient: 'from-cyan-500 to-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" />
      </svg>
    ),
  },
];

interface JobSummary {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  params: any;
}

const typeLabels: Record<string, string> = {
  generate: 'AI 生图',
  fission: '图裂变',
  print: '打印图',
  extract: '印花提取',
};

export default function DashboardPage() {
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [stats, setStats] = useState({ todayCount: 0, monthCount: 0, assetCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, assetsRes] = await Promise.all([
          axios.get('/api/jobs', { params: { pageSize: 8 } }),
          axios.get('/api/assets', { params: { pageSize: 1 } }),
        ]);
        setRecentJobs(jobsRes.data.data || []);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const allJobs = jobsRes.data.data || [];
        const todayCount = allJobs.filter((j: any) => j.createdAt >= todayStart).length;
        const assetCount = assetsRes.data.total || 0;

        setStats({ todayCount, monthCount: allJobs.length, assetCount });
      } catch {
        // ignore on first load
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: '今日生成', value: String(stats.todayCount) },
    { label: '近期任务', value: String(stats.monthCount) },
    { label: '素材总数', value: String(stats.assetCount) },
    { label: '账户余额', value: '¥0.00' },
  ];

  return (
    <>
      <PageHeader title="工作台" description="欢迎使用创次元 POD AI Studio" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            <div className="text-2xl font-bold text-white mt-1">{loading ? '-' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">快捷创作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="glass-card group p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{action.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">最近任务</h2>
          <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            查看全部 →
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            暂无任务，开始你的第一次创作吧
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/tasks`}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {typeLabels[job.type] || job.type}
                  </span>
                  <span className="text-sm text-gray-300 truncate max-w-[300px]">
                    {(job.params as any)?.prompt?.slice(0, 60) || `${job.type} 任务`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">
                    {new Date(job.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <TaskStatusBadge status={job.status as any} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
