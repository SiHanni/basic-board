import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';

import { SessionService } from '../../infra/session/session.service';
import { User } from '../../modules/users/user.entity';

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<RequestWithUser>();
    const res = httpCtx.getResponse<Response>();

    // cookie-parser가 설정되어 있다는 전제
    const sid =
      (req.cookies && (req.cookies['sid'] as string | undefined)) ??
      this.extractSidFromHeader(req);

    if (!sid) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: '로그인이 필요합니다.',
        details: null,
      });
    }

    const session = await this.sessionService.getSession(sid);
    if (!session) {
      // 세션이 없으면 쿠키도 정리
      res.clearCookie('sid', { path: '/' });
      throw new UnauthorizedException({
        code: 'INVALID_SESSION',
        message: '세션이 만료되었거나 유효하지 않습니다.',
        details: null,
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: session.userId },
    });
    if (!user) {
      // 유저가 없으면 세션도 함께 제거
      await this.sessionService.deleteSession(sid);
      res.clearCookie('sid', { path: '/' });
      throw new UnauthorizedException({
        code: 'INVALID_SESSION',
        message: '세션이 만료되었거나 유효하지 않습니다.',
        details: null,
      });
    }

    req.user = user;
    return true;
  }

  private extractSidFromHeader(req: Request): string | undefined {
    const header = req.headers['cookie'];
    if (!header) return undefined;
    const parts = header.split(';').map((p) => p.trim());
    const sidPart = parts.find((p) => p.startsWith('sid='));
    if (!sidPart) return undefined;
    return sidPart.substring('sid='.length);
  }
}
