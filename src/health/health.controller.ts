import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import * as path from 'path';
import { SkipResponseTransform } from '../common/skip-transform.decorator';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @SkipResponseTransform()
  @HealthCheck()
  check() {
    const storagePath = path.join(process.cwd(), 'storage');
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: storagePath,
          thresholdPercent: 0.99,
        }),
    ]);
  }
}
