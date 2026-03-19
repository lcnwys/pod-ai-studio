import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import type { Asset, PaginatedResponse, AssetType } from '@/lib/types';

interface AssetFilters {
  type?: AssetType;
  projectId?: string;
  isFavorited?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAssets(filters: AssetFilters = {}) {
  return useQuery<PaginatedResponse<Asset>>({
    queryKey: ['assets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.isFavorited) params.set('isFavorited', 'true');
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(filters.page || 1));
      params.set('pageSize', String(filters.pageSize || 24));
      const res = await apiClient.get(`/assets?${params.toString()}`);
      return res.data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation<Asset, Error, string>({
    mutationFn: async (assetId) => {
      const res = await apiClient.patch(`/assets/${assetId}/favorite`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDeleteAssets() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: async (assetIds) => {
      await apiClient.post('/assets/delete', { ids: assetIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
