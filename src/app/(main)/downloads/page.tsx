'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import axios from 'axios';

interface DownloadItem {
  id: string;
  type: string;
  fileName: string | null;
  fileId: string;
  createdAt: string;
}

export default function DownloadsPage() {
  const [assets, setAssets] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const { data } = await axios.get('/api/assets', { params: { pageSize: 50 } });
      setAssets(data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (asset: DownloadItem) => {
    setDownloading(prev => new Set(prev).add(asset.id));
    try {
      const { data } = await axios.get(`/api/assets/${asset.id}/download`);
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch {
      alert('下载失败');
    } finally {
      setDownloading(prev => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  };

  const typeLabels: Record<string, string> = {
    generate: 'AI 生图',
    fission: '图片裂变',
    print: '印刷大图',
    extract: '花纹提取',
    upload: '上传文件',
  };

  return (
    <>
      <PageHeader title="下载中心" description="管理和下载你的文件" />

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 mt-3">加载中...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <p className="text-gray-500">暂无可下载文件</p>
          <p className="text-xs text-gray-600 mt-1">完成任务后的文件将出现在这里</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">文件名</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">类型</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">创建时间</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs truncate max-w-[300px]">
                    {asset.fileName || asset.fileId}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {typeLabels[asset.type] || asset.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(asset.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(asset)}
                      disabled={downloading.has(asset.id)}
                      className="btn-secondary text-xs px-3 py-1 disabled:opacity-50"
                    >
                      {downloading.has(asset.id) ? '下载中...' : '下载'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
