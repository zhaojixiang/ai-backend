import { spawn } from 'child_process';

export interface RunCommandOptions {
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...options.env },
    });
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const timer =
      options.timeoutMs != null
        ? setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error(`命令超时（${options.timeoutMs}ms）: ${command}`));
          }, options.timeoutMs)
        : undefined;
    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `${command} 退出码 ${code}`));
    });
  });
}

export function runCommandWithStdout(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...options.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const timer =
      options.timeoutMs != null
        ? setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error(`命令超时（${options.timeoutMs}ms）: ${command}`));
          }, options.timeoutMs)
        : undefined;
    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `${command} 退出码 ${code}`));
    });
  });
}
