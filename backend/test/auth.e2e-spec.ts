import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/user.entity';

describe('Auth (e2e) - 세션/쿠키 로그인', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // e2e에서도 ValidationPipe는 직접 걸어줌
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // users 테이블 초기화
    await dataSource.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login · 성공 시 세션 쿠키 발급', async () => {
    // 1) 먼저 회원가입으로 유저 하나 만들어둔다.
    const signupPayload = {
      name: 'Login User',
      email: 'login@example.com',
      password: 'Str0ngP@ss1',
    };

    await request(app.getHttpServer())
      .post('/users')
      .send(signupPayload)
      .expect(201);

    // 2) 같은 계정으로 로그인 시도
    const loginPayload = {
      email: signupPayload.email,
      password: signupPayload.password,
    };

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginPayload)
      .expect(200);

    // 응답 바디 형태 검증
    expect(res.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: expect.any(String),
          name: signupPayload.name,
          email: signupPayload.email,
          profileImageUrl: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
      meta: expect.any(Object),
    });

    // 비밀번호 해시는 노출되면 안 됨
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // 세션 쿠키(sid)가 Set-Cookie 헤더에 있어야 한다.
    const rawSetCookie = res.headers['set-cookie'];
    expect(rawSetCookie).toBeDefined();

    // supertest / Node 응답 헤더 타입 특성상 string | string[] 일 수 있으므로
    const cookieHeader = Array.isArray(rawSetCookie)
      ? rawSetCookie.join(';')
      : (rawSetCookie as string);

    expect(cookieHeader).toContain('sid=');
  });

  it('POST /auth/login · 잘못된 비밀번호 → 401 INVALID_CREDENTIALS', async () => {
    const signupPayload = {
      name: 'Wrong Password User',
      email: 'wrongpass@example.com',
      password: 'Str0ngP@ss1',
    };

    // 유저 선행 생성
    await request(app.getHttpServer())
      .post('/users')
      .send(signupPayload)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: signupPayload.email,
        password: 'WrongPassword123!', // 틀린 비밀번호
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toEqual(expect.any(String));
  });

  it('POST /auth/login · 존재하지 않는 이메일 → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'not-exist@example.com',
        password: 'Whatever123!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toEqual(expect.any(String));
  });
});
