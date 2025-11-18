import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/user.entity';
import { SessionService } from '../../infra/session/session.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * 로그인 처리
   * - 이메일로 유저 조회
   * - 비밀번호 비교
   * - Redis 세션 생성
   * - user + sessionId 반환
   */
  async login(dto: LoginDto): Promise<{ user: User; sessionId: string }> {
    const { email, password } = dto;
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        details: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        details: null,
      });
    }

    const sessionId = await this.sessionService.createSession(user.id);

    return { user, sessionId };
  }
}
