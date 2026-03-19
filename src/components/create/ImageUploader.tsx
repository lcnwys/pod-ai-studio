'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '@/lib/hooks/useFileUpload';

interface UploadedImage {
  fileId: string;
  assetId: string;
  preview: string;
  name: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  label?: string;
}

export default function ImageUploader({ images, onChange, maxImages = 6, label = '参考图' }: ImageUploaderProps) {
  const upload = useFileUpload();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = maxImages - images.length;
    const files = acceptedFiles.slice(0, remaining);
    if (files.length === 0) return;

    setUploading(true);
    const newImages: UploadedImage[] = [];

    for (const file of files) {
      try {
        const result = await upload.mutateAsync(file);
        newImages.push({
          fileId: result.fileId,
          assetId: result.assetId,
          preview: URL.createObjectURL(file),
          name: file.name,
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    onChange([...images, ...newImages]);
    setUploading(false);
  }, [images, maxImages, onChange, upload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    disabled: images.length >= maxImages || uploading,
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs text-gray-600">{images.length}/{maxImages}</span>
      </div>

      {/* Uploaded thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-white/[0.1]">
              <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">上传中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs text-gray-500">拖拽或点击上传图片</span>
              <span className="text-xs text-gray-600">PNG / JPG / WEBP, 最大 5MB</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
