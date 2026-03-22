import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import type { AppConfiguration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfiguration, true>);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = config.get('corsOrigin', { infer: true });
  if (corsOrigin === '*') {
    app.enableCors({ origin: true });
  } else {
    const origins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({ origin: origins.length ? origins : true });
  }

  if (config.get('serveStorage', { infer: true })) {
    app.use('/storage', express.static(path.join(process.cwd(), 'storage')));
  }

  const port = config.get('port', { infer: true });
  await app.listen(port);
}
bootstrap();
