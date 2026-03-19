interface LoadingSkeletonProps {
  aspectRatio?: string;
  className?: string;
}

export default function LoadingSkeleton({ aspectRatio = '1/1', className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] ${className}`}
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-pulse" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs text-gray-500">AI 生成中...</span>
      </div>
    </div>
  );
}
