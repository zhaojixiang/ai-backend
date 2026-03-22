import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIPv4, isIPv6 } from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

function isPrivateOrLoopbackIp(ip: string): boolean {
  if (isIPv4(ip)) {
    if (ip === '0.0.0.0') return true;
    if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('169.254.'))
      return true;
    if (ip.startsWith('192.168.')) return true;
    const parts = ip.split('.').map(Number);
    if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      return true;
    return false;
  }
  if (isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true;
    if (lower.startsWith('fe80:')) return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;
    if (lower.startsWith('::ffff:')) {
      const v4 = lower.slice(7);
      return isPrivateOrLoopbackIp(v4);
    }
    return false;
  }
  return true;
}

/**
 * 降低 SSRF 风险：禁止内网/回环及元数据地址（无法覆盖 DNS 重绑定等全部场景）。
 */
export async function assertSafeHttpUrl(raw: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BadRequestException('无效的 URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException('仅允许 http/https 链接');
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new BadRequestException('不允许访问该主机');
  }
  if (isIPv4(host) || isIPv6(host)) {
    if (isPrivateOrLoopbackIp(host)) {
      throw new BadRequestException('不允许访问该 IP');
    }
    return;
  }
  try {
    const { address } = await lookup(host);
    if (isPrivateOrLoopbackIp(address)) {
      throw new BadRequestException('不允许访问该地址');
    }
  } catch (e) {
    if (e instanceof BadRequestException) throw e;
    throw new BadRequestException('无法解析该域名');
  }
}
