import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: '중복 이메일' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    // 통일된 응답 포맷 (success/data/meta) — meta는 전역 인터셉터가 채움
    return user;
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '내 정보 조회 (세션 필요)' })
  @ApiResponse({ status: 200, description: '인증된 사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '로그인 필요 또는 세션 만료' })
  getMe(@CurrentUser() user: User) {
    // TransformInterceptor가 감싸줄 것이므로 순수 데이터만 반환
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
