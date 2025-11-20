import { Controller, Param, Post as HttpPost, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CommentLikesService } from './comment-likes.service';
import { CommentLikeStatusResponseDto } from './dto/comment-like-status.dto';
import { SessionAuthGuard } from '../../../common/guards/session-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { User } from '../../users/user.entity';

@ApiTags('comment-likes')
@Controller('comments')
export class CommentLikesController {
  constructor(private readonly commentLikesService: CommentLikesService) {}

  @UseGuards(SessionAuthGuard)
  @HttpPost(':commentId/like')
  @ApiOperation({
    summary: '댓글 좋아요 토글',
    description:
      '현재 유저 기준으로 댓글 좋아요를 토글합니다. 이미 좋아요면 취소, 싫어요 상태면 좋아요로 전환합니다.',
  })
  @ApiParam({
    name: 'commentId',
    description: '좋아요를 설정할 댓글 ID',
    required: true,
  })
  @ApiOkResponse({ type: CommentLikeStatusResponseDto })
  async toggleLike(
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: User,
  ): Promise<CommentLikeStatusResponseDto> {
    const { comment, userReaction } =
      await this.commentLikesService.toggleCommentReaction(
        currentUser.id,
        commentId,
        'LIKE',
      );

    return {
      commentId: comment.id,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      userReaction,
    };
  }

  @UseGuards(SessionAuthGuard)
  @HttpPost(':commentId/dislike')
  @ApiOperation({
    summary: '댓글 싫어요 토글',
    description:
      '현재 유저 기준으로 댓글 싫어요를 토글합니다. 이미 싫어요면 취소, 좋아요 상태면 싫어요로 전환합니다.',
  })
  @ApiParam({
    name: 'commentId',
    description: '싫어요를 설정할 댓글 ID',
    required: true,
  })
  @ApiOkResponse({ type: CommentLikeStatusResponseDto })
  async toggleDislike(
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: User,
  ): Promise<CommentLikeStatusResponseDto> {
    const { comment, userReaction } =
      await this.commentLikesService.toggleCommentReaction(
        currentUser.id,
        commentId,
        'DISLIKE',
      );

    return {
      commentId: comment.id,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      userReaction,
    };
  }
}
