import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Comment } from './comment.entity';
import { Post } from '../posts/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ListCommentsByPostQueryDto } from './dto/list-comments-by-post.query.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(authorId: string, dto: CreateCommentDto): Promise<Comment> {
    const { postId, parentId, content } = dto;

    // 1) 게시글 존재 여부 체크 (soft delete 제외)
    const post = await this.postsRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '댓글을 작성할 게시글을 찾을 수 없습니다.',
        details: { postId },
      });
    }

    // 2) 부모 댓글 검증 (대댓글인 경우)
    let depth = 0;
    let normalizedParentId: string | null = null;

    if (parentId) {
      const parentComment = await this.commentsRepository.findOne({
        where: { id: parentId, deletedAt: IsNull() },
      });

      if (!parentComment || parentComment.postId !== postId) {
        throw new BadRequestException({
          code: 'INVALID_PARENT_COMMENT',
          message: '부모 댓글이 존재하지 않거나, 다른 게시글에 속해 있습니다.',
          details: { postId, parentId },
        });
      }

      if (parentComment.depth !== 0) {
        throw new BadRequestException({
          code: 'NESTED_REPLY_NOT_ALLOWED',
          message: '대댓글에는 다시 대댓글을 달 수 없습니다.',
          details: { parentId },
        });
      }

      depth = 1;
      normalizedParentId = parentId;
    }

    const comment = this.commentsRepository.create({
      postId,
      authorId,
      content,
      depth,
      parentId: normalizedParentId,
    });

    return this.commentsRepository.save(comment);
  }

  async findOneOrFail(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!comment) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: '해당 댓글을 찾을 수 없습니다.',
        details: { id },
      });
    }

    return comment;
  }

  async listByPost(
    postId: string,
    query: ListCommentsByPostQueryDto,
  ): Promise<{
    items: Comment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // 게시글 존재 여부 우선 확인
    const postExists = await this.postsRepository.exist({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!postExists) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '댓글 목록을 조회할 게시글을 찾을 수 없습니다.',
        details: { postId },
      });
    }

    const [items, total] = await this.commentsRepository.findAndCount({
      where: {
        postId,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'ASC', // 오래된 댓글부터
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async update(
    id: string,
    authorId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOneOrFail(id);

    if (comment.authorId !== authorId) {
      throw new ForbiddenException({
        code: 'COMMENT_FORBIDDEN',
        message: '본인이 작성한 댓글만 수정할 수 있습니다.',
        details: { commentId: id },
      });
    }

    if (dto.content !== undefined) {
      comment.content = dto.content;
    }

    return this.commentsRepository.save(comment);
  }

  async remove(id: string, authorId: string): Promise<void> {
    const comment = await this.findOneOrFail(id);

    if (comment.authorId !== authorId) {
      throw new ForbiddenException({
        code: 'COMMENT_FORBIDDEN',
        message: '본인이 작성한 댓글만 삭제할 수 있습니다.',
        details: { commentId: id },
      });
    }

    await this.commentsRepository.softRemove(comment);
  }
}
