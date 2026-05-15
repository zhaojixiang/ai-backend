import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { TransformResponseInterceptor } from './common/transform-response.interceptor';
import configuration from './config/configuration';
import type { AppConfiguration } from './config/configuration';
import { ArticleModule } from './article/article.module';
import { HealthModule } from './health/health.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<AppConfiguration, true>) => ({
        type: 'mysql',
        host: config.get('dbHost', { infer: true }),
        port: config.get('dbPort', { infer: true }),
        username: config.get('dbUser', { infer: true }),
        password: config.get('dbPassword', { infer: true }),
        database: config.get('dbName', { infer: true }),
        autoLoadEntities: true,
        synchronize: config.get('dbSync', { infer: true }),
        logging: config.get('nodeEnv', { infer: true }) === 'development',
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<AppConfiguration, true>) => {
        const password = config.get('redisPassword', { infer: true });
        return {
          config: {
            host: config.get('redisHost', { infer: true }),
            port: config.get('redisPort', { infer: true }),
            ...(password ? { password } : {}),
            lazyConnect: true,
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    HealthModule,
    VideoModule,
    ArticleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
