import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/user.entity';
import { Post } from '../src/modules/posts/post.entity';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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
    // posts, users 둘 다 정리
    await dataSource.createQueryBuilder().delete().from(Post).execute();
    await dataSource.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /posts · 로그인 상태에서 게시글 생성 성공', async () => {
    // 1) 회원가입
    const signupPayload = {
      name: 'Post User',
      email: 'postuser@example.com',
      password: 'Str0ngP@ss1',
    };

    await request(app.getHttpServer())
      .post('/users')
      .send(signupPayload)
      .expect(201);

    // 2) 로그인해서 세션 쿠키 가져오기
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: signupPayload.email,
        password: signupPayload.password,
      })
      .expect(200);

    const setCookie = loginRes.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie : [setCookie];

    // 3) 세션 쿠키를 들고 게시글 생성
    const createPayload = {
      title: '첫 게시글입니다',
      content: '내용 내용 내용',
    };

    const res = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', cookieHeader)
      .send(createPayload)
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      data: {
        post: {
          id: expect.any(String),
          title: createPayload.title,
          content: createPayload.content,
          authorId: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
      meta: expect.any(Object),
    });
  });

  it('POST /posts · 비로그인 상태 → 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts')
      .send({
        title: '로그인 없이 작성',
        content: '이건 막혀야 합니다',
      })
      .expect(401);

    // TransformInterceptor + 글로벌 예외필터 구조에 맞게 적당히 검증
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
