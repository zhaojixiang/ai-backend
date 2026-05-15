import * as path from 'path';

export interface AppConfiguration {
  port: number;
  nodeEnv: string;
  publicBaseUrl: string;
  corsOrigin: string;
  serveStorage: boolean;
  maxConcurrentVideoJobs: number;
  downloadTimeoutMs: number;
  ffmpegTimeoutMs: number;
  pythonBin: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  /** 开发环境可用 true 自动建表；生产请用迁移并设为 false */
  dbSync: boolean;
  redisHost: string;
  redisPort: number;
  redisPassword: string;
}

function parsePort(): number {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT 必须是 1–65535 的整数');
  }
  return port;
}

export default (): AppConfiguration => {
  const port = parsePort();
  const maxConcurrentVideoJobs = Math.min(
    32,
    Math.max(
      1,
      parseInt(process.env.MAX_CONCURRENT_VIDEO_JOBS ?? '2', 10) || 2,
    ),
  );
  const downloadTimeoutMs = Math.max(
    1000,
    parseInt(process.env.DOWNLOAD_TIMEOUT_MS ?? '600000', 10) || 600000,
  );
  const ffmpegTimeoutMs = Math.max(
    1000,
    parseInt(process.env.FFMPEG_TIMEOUT_MS ?? '3600000', 10) || 3600000,
  );

  const dbPort = parseInt(process.env.DB_PORT ?? '3306', 10);
  const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);

  return {
    port,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    publicBaseUrl:
      process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') ??
      `http://127.0.0.1:${port}`,
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    serveStorage: process.env.SERVE_STORAGE !== 'false',
    maxConcurrentVideoJobs,
    downloadTimeoutMs,
    ffmpegTimeoutMs,
    pythonBin:
      process.env.PYTHON_BIN ??
      path.join(process.cwd(), 'python/venv/bin/python'),
    dbHost: process.env.DB_HOST ?? '127.0.0.1',
    dbPort: Number.isNaN(dbPort) ? 3306 : dbPort,
    dbUser: process.env.DB_USER ?? 'root',
    dbPassword: process.env.DB_PASSWORD ?? '',
    dbName: process.env.DB_NAME ?? 'ai_backend',
    dbSync: process.env.DB_SYNC === 'true',
    redisHost: process.env.REDIS_HOST ?? '127.0.0.1',
    redisPort: Number.isNaN(redisPort) ? 6379 : redisPort,
    redisPassword: process.env.REDIS_PASSWORD ?? '',
  };
};
