// test/auth.e2e-spec.ts

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';

describe('Auth (e2e) - 세션/쿠키 기반 로그인', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // e2e 환경에서도 실제 앱과 동일하게 ValidationPipe 설정
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

  /**
   * 매 테스트마다 DB 초기화
   *
   * FK 제약 관계:
   * - posts.authorId → users.id (RESTRICT)
   * - comments.postId → posts.id (CASCADE)
   * - comments.authorId → users.id (RESTRICT)
   * - post_likes.postId → posts.id (CASCADE)
   * - post_likes.userId → users.id (CASCADE)
   * - comment_likes.commentId → comments.id (CASCADE)
   * - comment_likes.userId → users.id (CASCADE)
   *
   * ⇒ 자식 테이블부터 삭제해야 하고,
   *   MySQL에서는 FOREIGN_KEY_CHECKS를 꺼두고 TRUNCATE 하는 편이 e2e 테스트에선 가장 깔끔함.
   */
  const resetDatabase = async () => {
    // MySQL 기준
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');

    // FK 의존 순서: comment_likes → comments → post_likes → posts → users
    const tables = [
      'comment_likes',
      'comments',
      'post_likes',
      'posts',
      'users',
    ];

    for (const table of tables) {
      // 테이블 이름은 엔티티의 @Entity() 이름과 동일하게 사용
      await dataSource.query(`TRUNCATE TABLE \`${table}\`;`);
    }

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
  };

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login · 성공 시 세션 쿠키(sid) 발급 및 user 정보 응답', async () => {
    // 1) 먼저 회원가입으로 유저 하나 생성
    const signupPayload = {
      name: 'Login User',
      email: 'login@example.com',
      password: 'Str0ngP@ssw0rd',
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

    // 응답 바디 구조 검증 (global 응답 래핑 가정: { success, data, meta })
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

    // 세션 쿠키(sid)가 Set-Cookie 헤더에 포함되어야 함
    const rawSetCookie = res.headers['set-cookie'];
    expect(rawSetCookie).toBeDefined();

    const cookieHeader = Array.isArray(rawSetCookie)
      ? rawSetCookie.join(';')
      : (rawSetCookie as string);

    expect(cookieHeader).toContain('sid=');
  });

  it('POST /auth/login · 잘못된 비밀번호 → 401 INVALID_CREDENTIALS', async () => {
    const signupPayload = {
      name: 'Wrong Password User',
      email: 'wrongpass@example.com',
      password: 'Str0ngP@ssw0rd',
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

    // 공통 에러 응답 포맷 가정
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

  it('POST /auth/login · 검증 실패 (이메일 형식 아님) → 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'not-an-email', // 잘못된 이메일 형식
        password: 'short', // 비밀번호도 일부러 문제 있는 값
      })
      .expect(400);

    // ValidationPipe + 글로벌 에러 포맷에 따라 달라질 수 있어
    // 너무 구체적으로 묶지 않고 "실패했다" 수준만 검증
    // (원하시면 여기서 error.code, message 등 형식에 맞춰 추가 검증 가능)
    expect(res.body).toBeDefined();
  });
});
