import {
  Body,
  Controller,
  Param,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PostLikesService } from './post-likes.service';
import { PostLikeStatusResponseDto } from './dto/post-like-status.dto';
import { SessionAuthGuard } from '../../../common/guards/session-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { User } from '../../users/user.entity';

@ApiTags('post-likes')
@Controller('posts')
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  @UseGuards(SessionAuthGuard)
  @HttpPost(':postId/like')
  @ApiOperation({
    summary: '게시글 좋아요 토글',
    description:
      '현재 유저 기준으로 좋아요를 토글합니다. 이미 좋아요면 취소, 싫어요 상태면 좋아요로 전환합니다.',
  })
  @ApiParam({
    name: 'postId',
    description: '좋아요를 설정할 게시글 ID',
    required: true,
  })
  @ApiOkResponse({ type: PostLikeStatusResponseDto })
  async toggleLike(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: User,
  ): Promise<PostLikeStatusResponseDto> {
    const { post, userReaction } =
      await this.postLikesService.togglePostReaction(
        currentUser.id,
        postId,
        'LIKE',
      );

    return {
      postId: post.id,
      likeCount: post.likeCount,
      dislikeCount: post.dislikeCount,
      userReaction,
    };
  }

  @UseGuards(SessionAuthGuard)
  @HttpPost(':postId/dislike')
  @ApiOperation({
    summary: '게시글 싫어요 토글',
    description:
      '현재 유저 기준으로 싫어요를 토글합니다. 이미 싫어요면 취소, 좋아요 상태면 싫어요로 전환합니다.',
  })
  @ApiParam({
    name: 'postId',
    description: '싫어요를 설정할 게시글 ID',
    required: true,
  })
  @ApiOkResponse({ type: PostLikeStatusResponseDto })
  async toggleDislike(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: User,
  ): Promise<PostLikeStatusResponseDto> {
    const { post, userReaction } =
      await this.postLikesService.togglePostReaction(
        currentUser.id,
        postId,
        'DISLIKE',
      );

    return {
      postId: post.id,
      likeCount: post.likeCount,
      dislikeCount: post.dislikeCount,
      userReaction,
    };
  }
}
