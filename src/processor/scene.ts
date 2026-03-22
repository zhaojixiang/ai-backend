import * as path from 'path';
import { runCommandWithStdout } from '../common/run-command';

export function splitScenes(
  pythonBin: string,
  input: string,
  outputDir: string,
  timeoutMs: number,
): Promise<unknown[]> {
  const script = path.resolve(
    process.cwd(),
    'python/scripts/scenedetect_runner.py',
  );
  return runCommandWithStdout(
    pythonBin,
    [script, input, outputDir],
    { timeoutMs },
  ).then((stdout) => {
    const trimmed = stdout.trim();
    try {
      const result = JSON.parse(trimmed) as unknown[];
      if (!Array.isArray(result)) {
        throw new Error('分镜结果不是数组');
      }
      return result.map((item: any) => ({
        ...item,
        url: `/static/${item.index}.mp4`,
      }));
    } catch {
      throw new Error(`分镜 JSON 解析失败: ${trimmed.slice(0, 200)}`);
    }
  });
}
