import {
  Body,
  Controller,
  Delete,
  Param,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { ToggleLikeDto } from './dto/toggle-like.dto';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { User } from '../users/user.entity';

@ApiTags('likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /** 좋아요 생성 */
  @UseGuards(SessionAuthGuard)
  @HttpPost()
  @ApiOperation({ summary: '좋아요 생성' })
  @ApiCreatedResponse({
    description: '성공적으로 좋아요가 생성됨',
  })
  async createLike(
    @CurrentUser() currentUser: User,
    @Body() dto: CreateLikeDto,
  ) {
    return this.likesService.create(currentUser.id, dto);
  }

  /** 좋아요 삭제 */
  @UseGuards(SessionAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: '좋아요 취소' })
  @ApiParam({ name: 'id', description: '좋아요 ID' })
  @ApiOkResponse({
    description: '성공적으로 좋아요 취소됨',
  })
  async deleteLike(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.likesService.remove(id, currentUser.id);
  }

  /** 좋아요 토글 */
  @UseGuards(SessionAuthGuard)
  @HttpPost('toggle')
  @ApiOperation({ summary: '좋아요 토글(생성/취소 자동)' })
  @ApiOkResponse({
    description: '좋아요 결과 반환 (liked: true/false)',
  })
  async toggleLike(
    @CurrentUser() currentUser: User,
    @Body() dto: ToggleLikeDto,
  ) {
    return this.likesService.toggle(currentUser.id, dto);
  }
}
