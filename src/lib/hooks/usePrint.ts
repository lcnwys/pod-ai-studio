import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import type { Job } from '@/lib/types';

interface PrintParams {
  referenceImageId: string;
  dpi: number;
  imageWidth: number;
  imageHeight: number;
  selectedArea?: { cropX: number; cropY: number; cropW: number; cropH: number };
  projectId?: string;
  fileName?: string;
}

export function usePrint() {
  const queryClient = useQueryClient();
  const addTask = useTaskStore((s) => s.addTask);

  return useMutation<Job, Error, PrintParams>({
    mutationFn: async (params) => {
      const res = await apiClient.post('/jobs', {
        type: 'print',
        params,
      });
      return res.data;
    },
    onSuccess: (job) => {
      addTask(job.id, {
        id: job.id,
        type: 'print',
        status: job.status,
        createdAt: job.createdAt,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
