import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ✅ 실제 main.ts와 동일하게 cookie-parser + ValidationPipe 세팅
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Set-Cookie 헤더에서 sid 쿠키만 깔끔하게 뽑아오는 헬퍼
   * - "sid=...; Path=/; HttpOnly; ..." 형태에서 "sid=..." 부분만 추출
   */
  function extractSidCookieFromResponse(res: request.Response): string {
    const rawSetCookie = res.headers['set-cookie'];
    if (!rawSetCookie) {
      throw new Error('No Set-Cookie header found');
    }

    const cookies = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : [rawSetCookie as string];

    // sid= 로 시작하는 쿠키 찾기
    const sidCookie = cookies.find((c) => c.startsWith('sid='));
    if (!sidCookie) {
      throw new Error('sid cookie not found in Set-Cookie header');
    }

    // "sid=...; Path=/; HttpOnly" -> "sid=..."
    return sidCookie.split(';')[0];
  }

  /**
   * 회원가입 → 로그인까지 한 번에 처리하는 헬퍼
   * - 각 테스트가 서로 격리되도록 이메일을 매번 다르게 생성
   */
  async function signupAndLogin() {
    const uniqueSuffix = Date.now() + Math.random().toString(16).slice(2);
    const email = `user+${uniqueSuffix}@example.com`;
    const password = 'Str0ngP@ssw0rd';
    const name = 'Me User';

    // 1) 회원가입
    const signupRes = await request(server)
      .post('/users')
      .send({ name, email, password })
      .expect(201);

    expect(signupRes.body.success).toBe(true);
    const createdUser = signupRes.body.data as {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
      profileImageUrl: string | null;
    };

    // 2) 로그인
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    const loginUser = loginRes.body.data.user as {
      id: string;
      name: string;
      email: string;
      profileImageUrl: string | null;
      createdAt: string;
      updatedAt: string;
    };

    // 3) sid 쿠키 추출
    const sidCookie = extractSidCookieFromResponse(loginRes);

    return { signupUser: createdUser, loginUser, sidCookie };
  }

  it('POST /users · 회원가입 성공', async () => {
    const uniqueSuffix = Date.now() + Math.random().toString(16).slice(2);
    const email = `signup+${uniqueSuffix}@example.com`;

    const res = await request(server)
      .post('/users')
      .send({
        name: 'New User',
        email,
        password: 'Str0ngP@ssw0rd',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      name: 'New User',
      email,
      profileImageUrl: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // passwordHash 같은 내부 필드는 노출되면 안 됨
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('POST /users · 중복 이메일 → 409 USER_EMAIL_CONFLICT', async () => {
    const email = `duplicate+${Date.now()}@example.com`;
    const payload = {
      name: 'Dup User',
      email,
      password: 'Str0ngP@ssw0rd',
    };

    // 1) 첫 번째 회원가입 성공
    await request(server).post('/users').send(payload).expect(201);

    // 2) 같은 이메일로 다시 회원가입 시도
    const res = await request(server).post('/users').send(payload).expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_EMAIL_CONFLICT');
    expect(res.body.error.message).toEqual(expect.any(String));
  });

  it('POST /users · 검증 실패(이메일 형식 아님) → 400 Bad Request', async () => {
    const res = await request(server)
      .post('/users')
      .send({
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'Str0ngP@ssw0rd',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    // ValidationPipe 기본 에러 형식에 맞춰 대략적인 구조만 확인
    expect(res.body.error).toBeDefined();
  });

  it('GET /users/me · 세션 쿠키 없이 요청 시 401 Unauthorized', async () => {
    const res = await request(server).get('/users/me').expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('GET /users/me · 로그인 후 세션 쿠키로 내 정보 조회 성공', async () => {
    const httpServer = app.getHttpServer();

    // 1) 브라우저처럼 동작하는 agent 생성
    const agent = request.agent(httpServer);

    // 2) 회원가입
    const signupPayload = {
      name: 'Me User',
      email: 'me@example.com',
      password: 'Str0ngP@ssw0rd',
    };

    await agent.post('/users').send(signupPayload).expect(201);

    // 3) 로그인 (agent가 Set-Cookie → Cookie로 자동 유지)
    await agent
      .post('/auth/login')
      .send({
        email: signupPayload.email,
        password: signupPayload.password,
      })
      .expect(200);

    // 4) 이제 같은 agent로 /users/me 호출 (쿠키 자동 전송)
    const res = await agent.get('/users/me').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      name: signupPayload.name,
      email: signupPayload.email,
      profileImageUrl: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
