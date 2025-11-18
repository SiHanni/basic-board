import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

import { User } from '../src/modules/users/user.entity';
import { Post } from '../src/modules/posts/post.entity';
import { Comment } from '../src/modules/comments/comment.entity';
import { Like } from '../src/modules/likes/like.entity';

/** 회원가입 성공, 실패 시나리오 */
describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
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
    //  FK 순서 지키면서 QueryBuilder로 전체 삭제
    await dataSource.createQueryBuilder().delete().from(Like).execute();
    await dataSource.createQueryBuilder().delete().from(Comment).execute();
    await dataSource.createQueryBuilder().delete().from(Post).execute();
    await dataSource.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users · 성공', async () => {
    const payload = {
      name: 'LEE',
      email: 'lee@test.com',
      password: 'CorrectPassword3>',
    };

    const res = await request(app.getHttpServer())
      .post('/users')
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        name: payload.name,
        email: payload.email,
        profileImageUrl: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      meta: expect.any(Object),
    });

    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('POST /users · 중복 이메일 실패', async () => {
    const payload = {
      name: 'Dup User',
      email: 'dup@example.com',
      password: 'Str0ngP@ssw0rd',
    };

    // 선행 생성
    await request(app.getHttpServer()).post('/users').send(payload).expect(201);

    const res = await request(app.getHttpServer())
      .post('/users')
      .send(payload)
      .expect(409);

    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'USER_EMAIL_CONFLICT',
        message: expect.any(String),
        details: expect.anything(),
      },
      meta: expect.any(Object),
    });
  });

  it('POST /users · 검증 실패(짧은 비밀번호)', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Short Pass',
        email: 'short@example.com',
        password: '123', // too short
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('GET /users/me - 비로그인 접근 시 401', async () => {
    const res = await request(app.getHttpServer()).get('/users/me').expect(401); // HTTP status 자체를 supertest가 검증

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    // 여기서 statusCode는 강제로 보지 말고,
    // 우리가 실제로 넣은 필드(code, message)를 확인하는 쪽이 맞음
    expect(res.body.error.code).toBeDefined();
    expect(res.body.error.message).toBeDefined();
  });

  it('GET /users/me - 로그인 후 내 정보 조회 성공', async () => {
    // 1) 회원가입
    const signup = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'me',
        email: 'me@example.com',
        password: 'Password123!',
      })
      .expect(201);

    // 2) 로그인 → sid 쿠키 획득
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'me@example.com',
        password: 'Password123!',
      })
      .expect(200);

    const setCookieHeader = login.header['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    // string | string[] 를 강제로 배열로 맞추기
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader];

    const sidCookie = cookies.find((c) => c.startsWith('sid='));
    expect(sidCookie).toBeDefined();

    // 3) sid 쿠키로 내 정보 조회
    const meRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', sidCookie)
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data).toBeDefined();
    expect(meRes.body.data.email).toBe('me@example.com');
  });
});
