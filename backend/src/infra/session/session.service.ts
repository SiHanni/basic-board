import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

export interface SessionData {
  userId: string;
  createdAt: string;
}

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1:';
    const port = Number(
      this.configService.get<string>('REDIS_PORT') ?? '16380',
    );

    this.client = new Redis({
      host,
      port,
    });
  }
  private buildKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  /**
   * 세션 생성
   * - 랜덤 sessionId 생성
   * - Redis에 TTL과 함께 저장
   * - sessionId 반환 (쿠키로 내려줄 값)
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const key = this.buildKey(sessionId);

    const ttlSeconds = Number(
      this.configService.get<string>('SESSION_TTL_SECONDS') ?? 60 * 60 * 24 * 7, // 기본 7일
    );

    const payload: SessionData = {
      userId,
      createdAt: new Date().toISOString(),
    };

    await this.client.setex(key, ttlSeconds, JSON.stringify(payload));
    return sessionId;
  }

  /**
   * 세션 조회
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = this.buildKey(sessionId);
    const raw = await this.client.get(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as SessionData;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * 로그아웃 등 세션 제거
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = this.buildKey(sessionId);
    await this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
