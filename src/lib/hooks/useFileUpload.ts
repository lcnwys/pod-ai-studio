import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface UploadResult {
  fileId: string;
  assetId: string;
  thumbnailUrl: string;
}

export function useFileUpload() {
  return useMutation<UploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return res.data;
    },
  });
}
