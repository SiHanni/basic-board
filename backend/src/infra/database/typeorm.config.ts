import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmAsyncOptions: TypeOrmModuleAsyncOptions = {
  useFactory: (config: ConfigService) => ({
    type: 'mysql',
    host: config.get<string>('DB_HOST', '127.0.0.1'),
    port: Number(config.get<string>('DB_PORT', '3307')),
    username: config.get<string>('DB_USERNAME', 'root'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.get<string>('DB_DATABASE', 'basic_board'),
    // 개발 단계: 빠르게 스키마 확인 (나중에 false + 마이그 전환)
    synchronize: true,
    // 모듈 단위로 엔티티 자동 로드 (Users/Posts 등 추가 시 자동 인식)
    autoLoadEntities: true,
    // 로깅은 필요 시 'all'로 확인 가능
    logging: false,
    charset: 'utf8mb4',
  }),
  inject: [ConfigService],
};
