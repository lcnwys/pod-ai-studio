import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import type { Job } from '@/lib/types';

interface ExtractParams {
  referenceImageId: string;
  prompt?: string;
  resolutionRatioId: number;
  isPatternCompleted: number;
  projectId?: string;
  fileName?: string;
}

export function useExtract() {
  const queryClient = useQueryClient();
  const addTask = useTaskStore((s) => s.addTask);

  return useMutation<Job, Error, ExtractParams>({
    mutationFn: async (params) => {
      const res = await apiClient.post('/jobs', {
        type: 'extract',
        params,
      });
      return res.data;
    },
    onSuccess: (job) => {
      addTask(job.id, {
        id: job.id,
        type: 'extract',
        status: job.status,
        createdAt: job.createdAt,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
