export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export function ok<T>(data: T, message = '成功'): ApiResponse<T> {
  return { code: 200, data, message };
}

export function isApiResponse(value: unknown): value is ApiResponse {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.code === 'number' && 'data' in o && typeof o.message === 'string'
  );
}
