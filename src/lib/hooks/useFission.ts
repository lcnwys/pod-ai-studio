import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import type { Job } from '@/lib/types';

interface FissionParams {
  referenceImageId: string;
  prompt?: string;
  similarity: number;
  resolutionRatioId: number;
  aspectRatio: number;
  projectId?: string;
  fileName?: string;
}

export function useFission() {
  const queryClient = useQueryClient();
  const addTask = useTaskStore((s) => s.addTask);

  return useMutation<Job, Error, FissionParams>({
    mutationFn: async (params) => {
      const res = await apiClient.post('/jobs', {
        type: 'fission',
        params,
      });
      return res.data;
    },
    onSuccess: (job) => {
      addTask(job.id, {
        id: job.id,
        type: 'fission',
        status: job.status,
        createdAt: job.createdAt,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
