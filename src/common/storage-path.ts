import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 兼容早期基于时间戳的 taskId */
const LEGACY_NUMERIC_ID = /^\d{10,20}$/;

export function assertValidTaskId(id: string): void {
  if (UUID_RE.test(id) || LEGACY_NUMERIC_ID.test(id)) return;
  throw new BadRequestException('非法任务 ID');
}

export function resolveTaskDir(taskId: string): string {
  assertValidTaskId(taskId);
  const root = path.resolve(process.cwd(), 'storage');
  const dir = path.resolve(root, taskId);
  const relative = path.relative(root, dir);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new BadRequestException('非法任务路径');
  }
  return dir;
}

export function storageRoot(): string {
  return path.resolve(process.cwd(), 'storage');
}

export function ensureStorageRoot(): void {
  const root = storageRoot();
  fs.mkdirSync(root, { recursive: true });
}
