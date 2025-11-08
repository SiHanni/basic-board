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
      password: 'Str0ngP@ss1',
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
});
