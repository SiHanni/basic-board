import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 전역 파이프/인터셉터/필터는 실제 앱과 동일하게 세팅
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) should return ok with unified format', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    // 기본 포맷(성공 래핑) + DB 상태 포함
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok', db: 'up' },
      meta: expect.any(Object),
    });

    // meta 상세 검증
    expect(typeof res.body.meta.timestamp).toBe('string');
    expect(res.body.meta.path).toBe('/health');
    expect(typeof res.body.meta.appName).toBe('string');
    expect(['development', 'test', 'production']).toContain(res.body.meta.env);

    // traceId/latencyMs 및 헤더 일치 검증
    expect(typeof res.body.meta.traceId).toBe('string');
    expect(typeof res.body.meta.latencyMs).toBe('number');
    expect(res.body.meta.latencyMs).toBeGreaterThanOrEqual(0);

    const headerTraceId = res.headers['x-trace-id'];
    expect(headerTraceId).toBeTruthy();
    expect(res.body.meta.traceId).toBe(headerTraceId);
  });
});
