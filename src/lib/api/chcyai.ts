import { buildSignatureHeaders } from './signature';

const BASE_URL = process.env.CHCYAI_BASE_URL || 'https://api.chcyai.com';
const ACCESS_KEY = process.env.CHCYAI_ACCESS_KEY || '';
const SECRET_KEY = process.env.CHCYAI_SECRET_KEY || '';

export interface ChcyApiResponse<T = unknown> {
  data: T;
  requestId: string;
  status: string;
  error?: { code: string; success: boolean; message?: string };
}

function resolvePathParams(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  let resolved = path;
  for (const [k, v] of Object.entries(params)) {
    resolved = resolved.replace(`{${k}}`, encodeURIComponent(v));
  }
  return resolved;
}

export async function chcyRequest<T = unknown>(
  method: 'GET' | 'POST',
  path: string,
  options?: {
    body?: Record<string, unknown>;
    pathParams?: Record<string, string>;
    accessKey?: string;
    secretKey?: string;
  },
): Promise<ChcyApiResponse<T>> {
  const ak = options?.accessKey || ACCESS_KEY;
  const sk = options?.secretKey || SECRET_KEY;
  const resolvedPath = resolvePathParams(path, options?.pathParams);
  const bodyStr = options?.body ? JSON.stringify(options.body) : null;

  const authHeaders = buildSignatureHeaders(method, resolvedPath, ak, sk, null, bodyStr);
  const headers: Record<string, string> = { ...authHeaders };
  if (bodyStr) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${resolvedPath}`, {
    method,
    headers,
    body: bodyStr,
  });

  const json = await res.json();

  if (json.status === 'EXECUTE_ERROR') {
    const errCode = json.error?.code || 'UNKNOWN_ERROR';
    const err = new Error(`ChcyAI API Error: ${errCode}`) as Error & { code: string; response: typeof json };
    err.code = errCode;
    err.response = json;
    throw err;
  }

  return json as ChcyApiResponse<T>;
}

export async function uploadFileToChcyai(
  file: Buffer,
  fileName: string,
  accessKey?: string,
  secretKey?: string,
): Promise<string> {
  const ak = accessKey || ACCESS_KEY;
  const sk = secretKey || SECRET_KEY;
  const path = '/v1/files/uploads';
  const authHeaders = buildSignatureHeaders('POST', path, ak, sk, null, null);

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(file)], { type: 'application/octet-stream' });
  formData.append('file', blob, fileName);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  const json = await res.json();
  if (json.status === 'EXECUTE_ERROR') {
    throw new Error(`Upload failed: ${json.error?.code}`);
  }
  return json.data as string; // fileId
}

export async function getFileDownloadUrl(
  fileId: string,
  accessKey?: string,
  secretKey?: string,
): Promise<string> {
  const result = await chcyRequest<string>('GET', '/v1/files/downloads/{fileId}', {
    pathParams: { fileId },
    accessKey,
    secretKey,
  });
  return result.data;
}

// ===== Task creation helpers =====

export interface GenerateImageParams {
  callbackUrl: string;
  prompt: string;
  referenceImageIdList?: string[];
  aspectRatioId?: number;
  resolutionRatioId: number;
  fileName?: string;
}

export async function createGenerateTask(params: GenerateImageParams, ak?: string, sk?: string) {
  return chcyRequest<string>('POST', '/v1/images/generations', { body: params as unknown as Record<string, unknown>, accessKey: ak, secretKey: sk });
}

export async function queryGenerateResult(taskId: string, ak?: string, sk?: string) {
  return chcyRequest<{ generateImageId: string; deductibleAmount: number }>('GET', '/v1/images/info/{taskId}', { pathParams: { taskId }, accessKey: ak, secretKey: sk });
}

export interface PrintParams {
  callbackUrl: string;
  referenceImageId?: string;
  dpi: number;
  imageWidth: number;
  imageHeight: number;
  selectedArea?: { cropX: number; cropY: number; cropW: number; cropH: number };
  fileName?: string;
}

export async function createPrintTask(params: PrintParams, ak?: string, sk?: string) {
  return chcyRequest<string>('POST', '/v1/prints/generations', { body: params as unknown as Record<string, unknown>, accessKey: ak, secretKey: sk });
}

export async function queryPrintResult(taskId: string, ak?: string, sk?: string) {
  return chcyRequest<{ generateImageId: string; deductibleAmount: number }>('GET', '/v1/prints/info/{taskId}', { pathParams: { taskId }, accessKey: ak, secretKey: sk });
}

export interface ExtractParams {
  callbackUrl: string;
  referenceImageId: string;
  prompt?: string;
  resolutionRatioId: number;
  isPatternCompleted: number;
  fileName?: string;
}

export async function createExtractTask(params: ExtractParams, ak?: string, sk?: string) {
  return chcyRequest<string>('POST', '/v1/printing/generations', { body: params as unknown as Record<string, unknown>, accessKey: ak, secretKey: sk });
}

export async function queryExtractResult(taskId: string, ak?: string, sk?: string) {
  return chcyRequest<{ generateImageId: string; deductibleAmount: number }>('GET', '/v1/printing/info/{taskId}', { pathParams: { taskId }, accessKey: ak, secretKey: sk });
}

export interface FissionParams {
  callbackUrl: string;
  referenceImageId: string;
  prompt?: string;
  similarity: number;
  resolutionRatioId: number;
  aspectRatio: number;
  fileName?: string;
}

export async function createFissionTask(params: FissionParams, ak?: string, sk?: string) {
  return chcyRequest<string>('POST', '/v1/fission/generations', { body: params as unknown as Record<string, unknown>, accessKey: ak, secretKey: sk });
}

export async function queryFissionResult(taskId: string, ak?: string, sk?: string) {
  return chcyRequest<{ generateImageId: string; deductibleAmount: number }>('GET', '/v1/fission/info/{taskId}', { pathParams: { taskId }, accessKey: ak, secretKey: sk });
}
