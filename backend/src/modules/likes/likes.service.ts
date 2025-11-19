import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Like } from './like.entity';
import { Post } from '../posts/post.entity';
import { CreateLikeDto } from './dto/create-like.dto';
import { ToggleLikeDto } from './dto/toggle-like.dto';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,

    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /** 좋아요 생성 */
  async create(userId: string, dto: CreateLikeDto): Promise<Like> {
    const { postId } = dto;

    const post = await this.postsRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '좋아요할 게시글을 찾을 수 없습니다.',
        details: { postId },
      });
    }

    // 이미 좋아요 되어있으면 실패
    const exists = await this.likesRepository.findOne({
      where: { userId, postId, deletedAt: IsNull() },
    });

    if (exists) {
      throw new BadRequestException({
        code: 'ALREADY_LIKED',
        message: '이미 좋아요한 게시글입니다.',
        details: { postId },
      });
    }

    const like = this.likesRepository.create({ userId, postId });
    await this.likesRepository.save(like);

    // likeCount 증가
    await this.postsRepository.increment({ id: postId }, 'likeCount', 1);

    return like;
  }

  /** 좋아요 삭제 */
  async remove(id: string, userId: string): Promise<void> {
    const like = await this.likesRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!like) {
      throw new NotFoundException({
        code: 'LIKE_NOT_FOUND',
        message: '좋아요 기록을 찾을 수 없습니다.',
        details: { id },
      });
    }

    if (like.userId !== userId) {
      throw new ForbiddenException({
        code: 'LIKE_FORBIDDEN',
        message: '본인의 좋아요만 취소할 수 있습니다.',
        details: { id },
      });
    }

    // soft delete
    await this.likesRepository.softRemove(like);

    // likeCount 감소
    await this.postsRepository.decrement({ id: like.postId }, 'likeCount', 1);
  }

  /** 좋아요 토글 */
  async toggle(
    userId: string,
    dto: ToggleLikeDto,
  ): Promise<{ liked: boolean }> {
    const { postId } = dto;

    const post = await this.postsRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '게시글을 찾을 수 없습니다.',
        details: { postId },
      });
    }

    const existing = await this.likesRepository.findOne({
      where: { userId, postId, deletedAt: IsNull() },
    });

    if (existing) {
      // 좋아요 취소
      await this.likesRepository.softRemove(existing);
      await this.postsRepository.decrement({ id: postId }, 'likeCount', 1);
      return { liked: false };
    }

    // 좋아요 생성
    const like = this.likesRepository.create({ userId, postId });
    await this.likesRepository.save(like);

    await this.postsRepository.increment({ id: postId }, 'likeCount', 1);

    return { liked: true };
  }
}
