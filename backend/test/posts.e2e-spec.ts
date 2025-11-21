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

    // e2e에서도 ValidationPipe는 직접 설정
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
    // FK 제약 때문에 자식 테이블부터 지우고, 필요하면 FK 체크 끄고 TRUNCATE
    // 테스트 환경에서만 사용 (실서비스 절대 금지)
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

    // 좋아요, 댓글, 게시글, 유저 순서로 정리
    await dataSource.query('TRUNCATE TABLE comment_likes');
    await dataSource.query('TRUNCATE TABLE post_likes');
    await dataSource.query('TRUNCATE TABLE comments');
    await dataSource.query('TRUNCATE TABLE posts');
    await dataSource.query('TRUNCATE TABLE users');

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 회원가입 + 로그인 → sid 쿠키, user 정보 반환
   * - posts e2e에서 "로그인된 사용자"가 필요한 경우 공통 사용
   */
  async function signupAndLogin() {
    const signupPayload = {
      name: 'Post Writer',
      email: 'post-writer@example.com',
      password: 'Str0ngP@ssw0rd',
    };

    // 회원가입
    await request(app.getHttpServer())
      .post('/users')
      .send(signupPayload)
      .expect(201);

    // 로그인
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: signupPayload.email,
        password: signupPayload.password,
      })
      .expect(200);

    // 응답 구조 검증 (대략)
    expect(loginRes.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: expect.any(String),
          name: signupPayload.name,
          email: signupPayload.email,
        },
      },
      meta: expect.any(Object),
    });

    const rawSetCookie = loginRes.headers['set-cookie'];
    expect(rawSetCookie).toBeDefined();

    const cookieHeader = Array.isArray(rawSetCookie)
      ? rawSetCookie[0]
      : (rawSetCookie as string);

    const sidCookie = cookieHeader.split(';')[0]; // "sid=..." 형태만 추출

    const user = loginRes.body.data.user;

    return { user, sidCookie };
  }

  it('POST /posts · 로그인한 사용자가 게시글 생성 성공', async () => {
    const { sidCookie, user } = await signupAndLogin();

    const createPayload = {
      title: '첫 번째 게시글',
      content: '게시글 내용입니다.',
    };

    const res = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', sidCookie)
      .send(createPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      authorId: user.id,
      title: createPayload.title,
      content: createPayload.content,
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(res.body.meta).toBeDefined();
  });

  it('GET /posts · 기본 목록 조회 (페이지네이션 기본값) - 생성한 글 1개 조회', async () => {
    const { sidCookie } = await signupAndLogin();

    const createPayload = {
      title: '목록 테스트 게시글',
      content: '내용입니다.',
    };

    await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', sidCookie)
      .send(createPayload)
      .expect(201);

    const res = await request(app.getHttpServer()).get('/posts').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBe(1);

    const item = res.body.data.items[0];
    expect(item).toMatchObject({
      id: expect.any(String),
      title: createPayload.title,
      content: createPayload.content,
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(res.body.data.pagination).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('GET /posts/:id · 로그인 없이도 상세 조회 가능 + 조회수가 1씩 증가', async () => {
    const { sidCookie } = await signupAndLogin();

    // 1) 글 작성 (로그인 필요)
    const createPayload = {
      title: '뷰 카운트 테스트',
      content: '조회수 증가 테스트입니다.',
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', sidCookie)
      .send(createPayload)
      .expect(201);

    const postId = createRes.body.data.id as string;

    // 2) 로그인 없이 상세 조회 1회 → viewCount = 1
    const res1 = await request(app.getHttpServer())
      .get(`/posts/${postId}`)
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toMatchObject({
      id: postId,
      title: createPayload.title,
      viewCount: 1,
    });

    // 3) 다시 한 번 상세 조회 → viewCount = 2
    const res2 = await request(app.getHttpServer())
      .get(`/posts/${postId}`)
      .expect(200);

    expect(res2.body.data.viewCount).toBe(2);
  });

  it('PATCH /posts/:id · 작성자 본인이 수정 성공', async () => {
    const { sidCookie, user } = await signupAndLogin();

    const createPayload = {
      title: '수정 전 제목',
      content: '수정 전 내용',
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', sidCookie)
      .send(createPayload)
      .expect(201);

    const postId = createRes.body.data.id as string;

    const updatePayload = {
      title: '수정 후 제목',
      content: '수정 후 내용',
    };

    const res = await request(app.getHttpServer())
      .patch(`/posts/${postId}`)
      .set('Cookie', sidCookie)
      .send(updatePayload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: postId,
      authorId: user.id,
      title: updatePayload.title,
      content: updatePayload.content,
    });
  });

  it('PATCH /posts/:id · 다른 사용자가 수정 시 403 POST_FORBIDDEN', async () => {
    // 작성자 A
    const { sidCookie: writerCookie } = await signupAndLogin();

    const createPayload = {
      title: '남의 글',
      content: '남의 글 내용',
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', writerCookie)
      .send(createPayload)
      .expect(201);

    const postId = createRes.body.data.id as string;

    // 다른 사용자 B
    const signupPayloadB = {
      name: 'Another User',
      email: 'another@example.com',
      password: 'An0therP@ss',
    };

    await request(app.getHttpServer())
      .post('/users')
      .send(signupPayloadB)
      .expect(201);

    const loginResB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: signupPayloadB.email,
        password: signupPayloadB.password,
      })
      .expect(200);

    const rawSetCookieB = loginResB.headers['set-cookie'];
    const cookieHeaderB = Array.isArray(rawSetCookieB)
      ? rawSetCookieB[0]
      : (rawSetCookieB as string);
    const sidCookieB = cookieHeaderB.split(';')[0];

    const res = await request(app.getHttpServer())
      .patch(`/posts/${postId}`)
      .set('Cookie', sidCookieB)
      .send({ title: '탈취 시도', content: '허용되면 안 됨' })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('POST_FORBIDDEN');
  });

  it('DELETE /posts/:id · 작성자 본인이 삭제 후 조회 시 404 POST_NOT_FOUND', async () => {
    const { sidCookie } = await signupAndLogin();

    const createPayload = {
      title: '삭제용 게시글',
      content: '삭제 테스트용',
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', sidCookie)
      .send(createPayload)
      .expect(201);

    const postId = createRes.body.data.id as string;

    // 삭제
    await request(app.getHttpServer())
      .delete(`/posts/${postId}`)
      .set('Cookie', sidCookie)
      .expect(200);

    // 다시 조회 → 404
    const res = await request(app.getHttpServer())
      .get(`/posts/${postId}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('POST_NOT_FOUND');
  });
});
