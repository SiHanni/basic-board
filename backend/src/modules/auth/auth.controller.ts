// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 로그인
   * - 성공 시 세션 쿠키(sid) 발급
   * - 응답 바디에는 user 정보만 담고, 인터셉터가 success/data/meta로 감쌈
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일/비밀번호로 로그인하여 세션 쿠키를 발급받습니다.',
  })
  @ApiOkResponse({ description: '로그인 성공', type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: '이메일 또는 비밀번호가 올바르지 않음',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user, sessionId } = await this.authService.login(dto);

    // 세션 쿠키 설정
    res.cookie('sid', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true, // 로컬 http 환경이면 잠시 주석
      path: '/',
    });

    const userPayload = this.toUserResponse(user);

    // 컨트롤러는 순수 데이터만, 인터셉터가 최종 래핑
    return {
      user: userPayload,
    };
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
