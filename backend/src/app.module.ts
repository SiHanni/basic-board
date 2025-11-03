import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './infra/config/env.validation';
import { HealthModule } from './modules/health/health.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggerMiddleware } from './infra/logging/request-logger.middleware';

import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncOptions } from './infra/database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (raw) =>
        validateEnv({
          APP_NAME: raw.APP_NAME ?? 'basic-board',
          NODE_ENV: raw.NODE_ENV ?? 'development',
          PORT: raw.PORT ?? '3000',
          DB_HOST: raw.DB_HOST ?? '127.0.0.1',
          DB_PORT: raw.DB_PORT ?? '3307',
          DB_USERNAME: raw.DB_USERNAME ?? 'root',
          DB_PASSWORD: raw.DB_PASSWORD ?? '',
          DB_DATABASE: raw.DB_DATABASE ?? 'basic_board',
        }),
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncOptions), // 🔹 DB 연결
    HealthModule,
  ],
  controllers: [],
  // 아래는 Nest의 DI 컨테이너가 자동으로 전역 등록하게 하는 공식 방식이다.
  // Nest가 부팅할 때 알아서 전역 인터셉터(TransformInterceptor), 필터(AllExceptionsFilter)를 등록해준다.
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }, //  전역 인터셉터
    { provide: APP_FILTER, useClass: AllExceptionsFilter }, //  전역 필터
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 모든 라우트에 적용
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
