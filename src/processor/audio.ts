import { runCommand } from '../common/run-command';

export function extractAudio(
  input: string,
  output: string,
  timeoutMs: number,
): Promise<void> {
  return runCommand(
    'ffmpeg',
    ['-y', '-i', input, '-q:a', '0', '-map', 'a', output],
    { timeoutMs },
  );
}
