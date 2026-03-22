import * as fs from 'fs';
import * as path from 'path';

export type TaskStatusState =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface TaskStatusFile {
  status: TaskStatusState;
  taskId: string;
  url?: string;
  error?: string;
  updatedAt: string;
}

export function writeTaskStatus(
  baseDir: string,
  partial: Omit<TaskStatusFile, 'updatedAt'> & { updatedAt?: string },
): void {
  fs.mkdirSync(baseDir, { recursive: true });
  const payload: TaskStatusFile = {
    ...partial,
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(baseDir, 'task.json'),
    JSON.stringify(payload),
    'utf-8',
  );
}

export function readTaskStatus(baseDir: string): TaskStatusFile | null {
  const p = path.join(baseDir, 'task.json');
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as TaskStatusFile;
  } catch {
    return null;
  }
}
