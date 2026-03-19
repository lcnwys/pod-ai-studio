'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useAssets, useToggleFavorite, useDeleteAssets } from '@/lib/hooks/useAssets';
import type { AssetType, Asset } from '@/lib/types';

const typeFilters: { value: AssetType | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'generate', label: 'AI 生图' },
  { value: 'fission', label: '图裂变' },
  { value: 'print', label: '打印图' },
  { value: 'extract', label: '印花提取' },
  { value: 'upload', label: '上传' },
];

export default function AssetsPage() {
  const [typeFilter, setTypeFilter] = useState<AssetType | ''>('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAssets({
    type: typeFilter || undefined,
    search: search || undefined,
    page,
    pageSize: 24,
  });

  const toggleFavorite = useToggleFavorite();
  const deleteAssets = useDeleteAssets();

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const assets = data?.data || [];
  const total = data?.total || 0;

  return (
    <>
      <PageHeader
        title="素材库"
        description={`共 ${total} 个素材`}
        actions={
          selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">已选 {selectedIds.size} 项</span>
              <button className="btn-secondary text-xs">批量下载</button>
              <button
                onClick={() => { deleteAssets.mutate(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                className="btn-secondary text-xs text-red-400 hover:text-red-300"
              >
                删除
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="btn-ghost text-xs">取消</button>
            </div>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setTypeFilter(f.value as AssetType | ''); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${typeFilter === f.value ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="搜索素材..."
          className="input-field w-60"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
          </svg>
          <p className="text-gray-500">暂无素材</p>
          <p className="text-xs text-gray-600 mt-1">开始创作，你的作品将出现在这里</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {assets.map((asset: Asset) => (
              <div
                key={asset.id}
                className={`group relative aspect-square rounded-2xl overflow-hidden border transition-all cursor-pointer
                  ${selectedIds.has(asset.id) ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/[0.06] hover:border-white/[0.12]'}
                `}
                onClick={() => toggleSelect(asset.id)}
              >
                {/* Thumbnail */}
                <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center">
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.fileName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159" />
                      </svg>
                      <span className="text-[10px] text-gray-600 font-mono mt-1 block">{asset.fileId.slice(0, 8)}</span>
                    </div>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-xs text-white font-medium truncate">{asset.fileName || asset.fileId.slice(0, 12)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{asset.type}</div>
                  </div>
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/40 text-gray-300 backdrop-blur-sm">
                    {asset.type}
                  </span>
                </div>

                {/* Favorite */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate(asset.id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className={`w-5 h-5 ${asset.isFavorited ? 'text-yellow-400 fill-yellow-400' : 'text-white/60'}`} viewBox="0 0 24 24" stroke="currentColor" fill={asset.isFavorited ? 'currentColor' : 'none'}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>

                {/* Select checkbox */}
                <div className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                  ${selectedIds.has(asset.id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-white/30 opacity-0 group-hover:opacity-100'
                  }
                `} style={{ top: 32 }}>
                  {selectedIds.has(asset.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > 24 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs">上一页</button>
              <span className="text-xs text-gray-500">第 {page} 页 / 共 {Math.ceil(total / 24)} 页</span>
              <button disabled={page >= Math.ceil(total / 24)} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs">下一页</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
