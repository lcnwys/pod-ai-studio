import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import type { Job } from '@/lib/types';

interface GenerateParams {
  prompt: string;
  referenceImageIds?: string[];
  aspectRatioId?: number;
  resolutionRatioId: number;
  projectId?: string;
  fileName?: string;
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  const addTask = useTaskStore((s) => s.addTask);

  return useMutation<Job, Error, GenerateParams>({
    mutationFn: async (params) => {
      const res = await apiClient.post('/jobs', {
        type: 'generate',
        params,
      });
      return res.data;
    },
    onSuccess: (job) => {
      addTask(job.id, {
        id: job.id,
        type: 'generate',
        status: job.status,
        createdAt: job.createdAt,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
