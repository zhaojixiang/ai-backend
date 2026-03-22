import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import type { AppConfiguration } from '../config/configuration';
import { ok } from '../common/api-response';
import { assertSafeHttpUrl } from '../common/url-safety';
import {
  ensureStorageRoot,
  resolveTaskDir,
  storageRoot,
} from '../common/storage-path';
import { extractAudio } from '../processor/audio';
import { downloadFromUrl } from '../processor/downloader';
import { splitScenes } from '../processor/scene';
import { readTaskStatus, writeTaskStatus } from './task-status';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly waiters: Array<() => void> = [];
  private running = 0;

  constructor(
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  private get maxConcurrent(): number {
    return this.configService.get('maxConcurrentVideoJobs', { infer: true });
  }

  private async acquireSlot(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.running += 1;
  }

  private releaseSlot(): void {
    this.running -= 1;
    const next = this.waiters.shift();
    if (next) next();
  }

  async process(url: string) {
    await assertSafeHttpUrl(url);
    ensureStorageRoot();

    const taskId = randomUUID();
    const baseDir = path.join(storageRoot(), taskId);
    const sceneDir = path.join(baseDir, 'scenes');

    fs.mkdirSync(sceneDir, { recursive: true });

    writeTaskStatus(baseDir, { status: 'queued', taskId, url });

    const publicBaseUrl = this.configService.get('publicBaseUrl', {
      infer: true,
    });
    const videoUrl = `${publicBaseUrl}/storage/${taskId}/video.mp4`;

    void this.runPipelineJob(taskId, url).catch((err) => {
      this.logger.error(`任务 ${taskId} 未捕获错误`, err?.stack ?? err);
    });

    return {
      taskId,
      videoUrl,
      status: 'queued' as const,
    };
  }

  private async runPipelineJob(taskId: string, url: string): Promise<void> {
    const baseDir = path.join(storageRoot(), taskId);
    const videoPath = path.join(baseDir, 'video.mp4');
    const audioPath = path.join(baseDir, 'audio.mp3');
    const sceneDir = path.join(baseDir, 'scenes');
    const downloadTimeoutMs = this.configService.get('downloadTimeoutMs', {
      infer: true,
    });
    const ffmpegTimeoutMs = this.configService.get('ffmpegTimeoutMs', {
      infer: true,
    });
    const pythonBin = this.configService.get('pythonBin', { infer: true });

    await this.acquireSlot();
    try {
      writeTaskStatus(baseDir, { status: 'processing', taskId, url });
      await downloadFromUrl(url, baseDir, downloadTimeoutMs);
      await extractAudio(videoPath, audioPath, ffmpegTimeoutMs);
      await splitScenes(pythonBin, videoPath, sceneDir, ffmpegTimeoutMs);
      writeTaskStatus(baseDir, { status: 'completed', taskId, url });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`任务 ${taskId} 失败: ${message}`);
      writeTaskStatus(baseDir, {
        status: 'failed',
        taskId,
        url,
        error: message,
      });
    } finally {
      this.releaseSlot();
    }
  }

  async getScenes(id: string) {
    const baseDir = resolveTaskDir(id);
    const jsonPath = path.join(baseDir, 'scenes.json');

    if (!fs.existsSync(jsonPath)) {
      return ok(null, '视频还在处理中或不存在');
    }

    let scenes: Array<{ index: number; start: number; end: number }>;
    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(content) as unknown;
      if (!Array.isArray(parsed)) {
        throw new SyntaxError('scenes 不是数组');
      }
      scenes = parsed as Array<{ index: number; start: number; end: number }>;
    } catch (e) {
      this.logger.warn(`读取 scenes.json 失败 task=${id}`, e);
      throw new BadRequestException('分镜数据损坏或格式无效');
    }

    const publicBaseUrl = this.configService.get('publicBaseUrl', {
      infer: true,
    });
    const videoUrl = `${publicBaseUrl}/storage/${id}/video.mp4`;

    const result = scenes.map((item) => ({
      id: item.index,
      start: item.start,
      end: item.end,
      file: videoUrl,
    }));

    return ok(result, '获取成功');
  }

  getStatus(id: string) {
    const baseDir = resolveTaskDir(id);
    if (!fs.existsSync(baseDir)) {
      throw new NotFoundException('任务不存在');
    }
    const status = readTaskStatus(baseDir);
    if (!status) {
      return ok(
        { taskId: id, status: 'unknown' as const },
        '无状态信息（可能为旧任务）',
      );
    }
    return ok(status, '获取成功');
  }
}
