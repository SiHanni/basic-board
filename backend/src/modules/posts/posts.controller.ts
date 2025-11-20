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
  ApiTags,
} from '@nestjs/swagger';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { ListPostsResponseDto } from './dto/list-posts-response.dto';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';

import { Post as PostEntity } from './post.entity';
import type { User } from '../users/user.entity';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 게시글 생성
   */
  @UseGuards(SessionAuthGuard)
  @HttpPost()
  @ApiOperation({ summary: '게시글 생성' })
  @ApiCreatedResponse({ type: PostResponseDto })
  async createPost(
    @CurrentUser() currentUser: User,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.create(currentUser.id, createPostDto);
    return this.toPostResponseDto(post);
  }

  /**
   * 게시글 목록 조회 (페이지네이션 + 검색)
   * - ListPostsQueryDto 안에 keyword(또는 searchTerm 등)가 있다면
   *   서비스에서 제목/본문 검색까지 처리한다고 가정
   */
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회 (페이지네이션 + 검색)' })
  @ApiOkResponse({ type: ListPostsResponseDto })
  async listPosts(
    @Query() listPostsQueryDto: ListPostsQueryDto,
  ): Promise<ListPostsResponseDto> {
    const { items, pagination } =
      await this.postsService.list(listPostsQueryDto);

    return {
      items: items.map((post) => this.toPostResponseDto(post)),
      pagination,
    };
  }

  /**
   * 게시글 상세 조회 + 조회수 1 증가 + (로그인 유저의 좋아요/싫어요 상태)
   *
   * - 로그인 유저가 아니라면 userLiked/userDisliked는 false로 내려감
   * - 로그인 유저라면 현재 해당 게시글에 대해
   *   LIKE / DISLIKE 중 무엇을 눌렀는지 반영됨
   */
  @UseGuards(SessionAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: '게시글 상세 조회 (조회수 증가 + 좋아요/싫어요 상태 포함)',
  })
  @ApiOkResponse({ type: PostResponseDto })
  async getPost(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<PostResponseDto> {
    const { post, userLiked, userDisliked } =
      await this.postsService.getDetailWithLikeStatus(id, currentUser.id);

    return this.toPostResponseDto(post, userLiked, userDisliked);
  }

  /**
   * 게시글 수정 (부분 수정 → PATCH 사용)
   * - 제목만 수정 / 본문만 수정 / 둘 다 수정 모두 허용
   */
  @UseGuards(SessionAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정 (부분 수정, PATCH)' })
  @ApiOkResponse({ type: PostResponseDto })
  async updatePost(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.update(
      id,
      currentUser.id,
      updatePostDto,
    );
    return this.toPostResponseDto(post);
  }

  /**
   * 게시글 삭제 (Soft Delete)
   */
  @UseGuards(SessionAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: '게시글 삭제 (Soft Delete)' })
  @ApiOkResponse({
    description:
      '성공 시 TransformInterceptor에 의해 { success, data: null, meta } 형태로 응답됩니다.',
  })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.postsService.remove(id, currentUser.id);
  }

  /**
   * Entity -> Response DTO 변환
   * - 목록에서는 userLiked/userDisliked 정보가 없으므로 기본값 false
   * - 상세 조회에서는 서비스에서 계산한 값을 넘겨줌
   */
  private toPostResponseDto(
    post: PostEntity,
    userLiked = false,
    userDisliked = false,
  ): PostResponseDto {
    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      content: post.content,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      dislikeCount: post.dislikeCount,
      userLiked,
      userDisliked,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
