import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ListCommentsByPostQueryDto } from './dto/list-comments-by-post.query.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ListCommentsResponseDto } from './dto/list-comments-response.dto';

import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../users/user.entity';
import { Comment } from './comment.entity';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // 댓글 / 대댓글 생성
  @UseGuards(SessionAuthGuard)
  @HttpPost()
  @ApiOperation({ summary: '댓글 또는 대댓글 생성' })
  @ApiCreatedResponse({ type: CommentResponseDto })
  async createComment(
    @CurrentUser() currentUser: User,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsService.create(
      currentUser.id,
      createCommentDto,
    );
    return this.toCommentResponseDto(comment);
  }

  // 게시글별 댓글 목록 조회
  @Get('by-post/:postId')
  @ApiOperation({ summary: '게시글별 댓글 목록 조회 (페이지네이션)' })
  @ApiParam({
    name: 'postId',
    description: '댓글 목록을 조회할 게시글 ID',
    required: true,
  })
  @ApiOkResponse({ type: ListCommentsResponseDto })
  async listCommentsByPost(
    @Param('postId') postId: string,
    @Query() listCommentsByPostQueryDto: ListCommentsByPostQueryDto,
  ): Promise<ListCommentsResponseDto> {
    const { items, pagination } = await this.commentsService.listByPost(
      postId,
      listCommentsByPostQueryDto,
    );

    return {
      items: items.map((comment) => this.toCommentResponseDto(comment)),
      pagination,
    };
  }

  // 댓글 수정
  @UseGuards(SessionAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: '댓글 수정' })
  @ApiOkResponse({ type: CommentResponseDto })
  async updateComment(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsService.update(
      id,
      currentUser.id,
      updateCommentDto,
    );
    return this.toCommentResponseDto(comment);
  }

  // 댓글 삭제 (soft delete)
  @UseGuards(SessionAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: '댓글 삭제 (Soft Delete)' })
  @ApiOkResponse({
    description:
      '성공 시 success: true (TransformInterceptor에 의해 래핑된 빈 바디)',
  })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.commentsService.remove(id, currentUser.id);
  }

  // Entity -> DTO 변환
  private toCommentResponseDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      depth: comment.depth,
      parentId: comment.parentId ?? null,
      content: comment.content,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
