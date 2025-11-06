import 'dotenv/config';
import { DataSource } from 'typeorm';

/** 마이그레이션용 */
export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? '3307'),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'basic_board',
  charset: 'utf8mb4',
  synchronize: false,
  logging: false,

  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/infra/database/migrations/*.ts'],
});
