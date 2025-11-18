import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggerMiddleware } from './infra/logging/request-logger.middleware';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST ?? '127.0.0.1',
        port: Number(process.env.DB_PORT ?? '3307'),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_DATABASE ?? 'basic_board',
        synchronize: false,
        autoLoadEntities: true,
        logging: false,
        charset: 'utf8mb4',
      }),
    }),
    HealthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    AuthModule,
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
