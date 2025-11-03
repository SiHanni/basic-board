import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check() {
    // 간단한 핑: SELECT 1
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', db: 'up' as const };
  }
}
