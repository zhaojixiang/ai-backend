import * as path from 'path';
import { runCommand } from '../common/run-command';
import { assertSafeHttpUrl } from '../common/url-safety';

export async function downloadFromUrl(
  url: string,
  outputDir: string,
  timeoutMs: number,
): Promise<void> {
  await assertSafeHttpUrl(url);
  const output = path.join(outputDir, 'video.%(ext)s');
  await runCommand('yt-dlp', ['-o', output, '--no-playlist', url], {
    timeoutMs,
  });
}
