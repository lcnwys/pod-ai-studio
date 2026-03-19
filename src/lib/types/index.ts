// ===== Enums / Constants =====
export const JOB_TYPES = ['generate', 'fission', 'print', 'extract'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ['PENDING', 'SUBMITTED', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRYING'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const BATCH_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL_FAILED'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const ASSET_TYPES = ['generate', 'fission', 'print', 'extract', 'upload'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASPECT_RATIOS = [
  { id: 0, label: '1:1', w: 1, h: 1 },
  { id: 1, label: '4:3', w: 4, h: 3 },
  { id: 2, label: '3:4', w: 3, h: 4 },
  { id: 3, label: '4:5', w: 4, h: 5 },
  { id: 4, label: '5:4', w: 5, h: 4 },
  { id: 5, label: '9:16', w: 9, h: 16 },
  { id: 6, label: '16:9', w: 16, h: 9 },
  { id: 7, label: '21:9', w: 21, h: 9 },
] as const;

export const RESOLUTIONS = [
  { id: 0, label: '1K' },
  { id: 1, label: '2K' },
  { id: 2, label: '4K' },
] as const;

// ===== Data Models =====
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: string;
  balance: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  tags: string[];
  assetCount: number;
  createdAt: string;
}

export interface Asset {
  id: string;
  userId: string;
  projectId: string | null;
  jobId: string | null;
  type: AssetType;
  fileId: string;
  fileName: string | null;
  thumbnailUrl: string | null;
  originalUrl: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  metadata: Record<string, unknown> | null;
  tags: string[];
  isFavorited: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  externalTaskId: string | null;
  params: Record<string, unknown>;
  result: { generateImageId?: string; deductibleAmount?: number } | null;
  error: { code?: string; message?: string } | null;
  retryCount: number;
  maxRetries: number;
  cost: number | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface BatchJob {
  id: string;
  name: string | null;
  type: JobType;
  status: BatchStatus;
  sourceFileName: string | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface BatchJobItem {
  id: string;
  batchJobId: string;
  jobId: string | null;
  rowIndex: number;
  status: JobStatus;
  params: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  retryCount: number;
  createdAt: string;
}

// ===== API Request/Response =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateJobRequest {
  type: JobType;
  params: Record<string, unknown>;
  projectId?: string;
}

export interface CreateBatchRequest {
  type: JobType;
  name?: string;
  items: Record<string, unknown>[];
  columnMapping?: Record<string, string>;
  projectId?: string;
}
