import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import type { Job } from '@/lib/types';

export function useTaskPolling(jobId: string | null) {
  return useQuery<Job>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await apiClient.get(`/jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'SUCCESS' || status === 'FAILED') return false;
      const age = Date.now() - (query.state.dataUpdatedAt || Date.now());
      return age < 30000 ? 2000 : 5000;
    },
    refetchIntervalInBackground: true,
  });
}
