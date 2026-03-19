import type { JobStatus } from '@/lib/types';

const statusConfig: Record<JobStatus, { className: string; label: string }> = {
  PENDING: { className: 'status-pending', label: '排队中' },
  SUBMITTED: { className: 'status-running', label: '已提交' },
  PROCESSING: { className: 'status-running', label: '处理中' },
  SUCCESS: { className: 'status-success', label: '已完成' },
  FAILED: { className: 'status-failed', label: '失败' },
  RETRYING: { className: 'status-pending', label: '重试中' },
};

export default function TaskStatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={config.className}>
      {(status === 'PROCESSING' || status === 'SUBMITTED') && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
