// test/comments.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/user.entity';
import { Post } from '../src/modules/posts/post.entity';
import { Comment } from '../src/modules/comments/comment.entity';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 전역 ValidationPipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    // cookie-parser
    app.use(cookieParser());

    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    const commentLikesRepo = dataSource.getRepository(CommentLike);
    const commentsRepo = dataSource.getRepository(Comment);
    const postLikesRepo = dataSource.getRepository(PostLike);
    const postsRepo = dataSource.getRepository(Post);
    const usersRepo = dataSource.getRepository(User);

    // FK 순서: 가장 말단부터 지우기
    await commentLikesRepo.createQueryBuilder().delete().execute();
    await postLikesRepo.createQueryBuilder().delete().execute();
    await commentsRepo.createQueryBuilder().delete().execute();
    await postsRepo.createQueryBuilder().delete().execute();
    await usersRepo.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 헬퍼: 회원가입 + 로그인 → 세션 쿠키와 유저 정보 반환
   */
  async function signupAndLogin() {
    const signupPayload = {
      name: 'Comment User',
      email: `comment-user-${Date.now()}@example.com`,
      password: 'Str0ngP@ssw0rd',
    };

    // 1) 회원가입
    await request(app.getHttpServer())
      .post('/users')
      .send(signupPayload)
      .expect(201);

    // 2) 로그인
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: signupPayload.email,
        password: signupPayload.password,
      })
      .expect(200);

    const rawSetCookie = loginRes.headers['set-cookie'];
    expect(rawSetCookie).toBeDefined();

    const sidCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie[0]
      : (rawSetCookie as string);

    const user = loginRes.body.data.user;

    return { sidCookie, user };
  }

  /**
   * 헬퍼: 로그인 유저로 게시글 하나 생성
   */
  async function createPostWithSession(sidCookie: string) {
    const payload = {
      title: '댓글 테스트용 게시글',
      content: '내용입니다.',
    };

    const res = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', sidCookie)
      .send(payload)
      .expect(201);

    return res.body.data as {
      id: string;
      title: string;
      content: string;
      authorId: string;
    };
  }

  it('POST /comments · 로그인한 사용자가 댓글(깊이 0) 생성 성공', async () => {
    const { sidCookie, user } = await signupAndLogin();
    const post = await createPostWithSession(sidCookie);

    const createCommentPayload = {
      postId: post.id,
      content: '첫 댓글입니다.',
    };

    const res = await request(app.getHttpServer())
      .post('/comments')
      .set('Cookie', sidCookie)
      .send(createCommentPayload)
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        postId: post.id,
        authorId: user.id,
        depth: 0,
        parentId: null,
        content: '첫 댓글입니다.',
        likeCount: 0,
        dislikeCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      meta: expect.any(Object),
    });
  });

  it('POST /comments · 존재하지 않는 게시글에 댓글 작성 시 404 POST_NOT_FOUND', async () => {
    const { sidCookie } = await signupAndLogin();

    const res = await request(app.getHttpServer())
      .post('/comments')
      .set('Cookie', sidCookie)
      .send({
        postId: '00000000-0000-0000-0000-000000000000',
        content: '이건 실패해야 합니다.',
      })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('POST_NOT_FOUND');
  });

  it('POST /comments · 대댓글(depth 1) 생성 성공', async () => {
    const { sidCookie } = await signupAndLogin();
    const post = await createPostWithSession(sidCookie);

    // 1) 먼저 상위 댓글 생성
    const parentRes = await request(app.getHttpServer())
      .post('/comments')
      .set('Cookie', sidCookie)
      .send({
        postId: post.id,
        content: '부모 댓글입니다.',
      })
      .expect(201);

    const parentComment = parentRes.body.data;

    // 2) 대댓글 생성
    const replyRes = await request(app.getHttpServer())
      .post('/comments')
      .set('Cookie', sidCookie)
      .send({
        postId: post.id,
        parentId: parentComment.id,
        content: '대댓글입니다.',
      })
      .expect(201);

    expect(replyRes.body.data.depth).toBe(1);
    expect(replyRes.body.data.parentId).toBe(parentComment.id);
  });

  it('GET /comments/by-post/:postId · 게시글별 댓글 목록 조회 (페이지네이션)', async () => {
    const { sidCookie } = await signupAndLogin();
    const post = await createPostWithSession(sidCookie);

    // 댓글 2개 생성
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post('/comments')
        .set('Cookie', sidCookie)
        .send({
          postId: post.id,
          content: `댓글 ${i + 1}`,
        })
        .expect(201);
    }

    const res = await request(app.getHttpServer())
      .get(`/comments/by-post/${post.id}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('PATCH /comments/:id · 작성자가 자신의 댓글 수정 성공', async () => {
    const { sidCookie } = await signupAndLogin();
    const post = await createPostWithSession(sidCookie);

    const createRes = await request(app.getHttpServer())
      .post('/comments')
      .set('Cookie', sidCookie)
      .send({
        postId: post.id,
        content: '수정 전 댓글',
      })
      .expect(201);

    const comment = createRes.body.data;

    const updateRes = await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set('Cookie', sidCookie)
      .send({
        content: '수정 후 댓글',
      })
      .expect(200);

    expect(updateRes.body.data.content).toBe('수정 후 댓글');
  });

  it('DELETE /comments/:id · 작성자가 자신의 댓글 삭제 성공', async () => {
    const { sidCookie } = await signupAndLogin();
    const post = await createPostWithSession(sidCookie);

    const createRes = await request(app.getHttpServer())
      .post('/comments')
      .set('Cookie', sidCookie)
      .send({
        postId: post.id,
        content: '삭제할 댓글',
      })
      .expect(201);

    const comment = createRes.body.data;

    await request(app.getHttpServer())
      .delete(`/comments/${comment.id}`)
      .set('Cookie', sidCookie)
      .expect(200);

    // soft delete 되었는지 확인: 다시 수정 시도 → 404 COMMENT_NOT_FOUND
    const res = await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set('Cookie', sidCookie)
      .send({ content: '이건 실패해야 함' })
      .expect(404);

    expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
  });
});
