import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { Post } from '../../posts/post.entity';
import { User } from '../../users/user.entity';
import { PostLike, PostReactionType } from './post-like.entity';

export type PostReactionState = PostReactionType | 'NONE';

@Injectable()
export class PostLikesService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PostLike)
    private readonly postLikesRepository: Repository<PostLike>,
  ) {}

  /**
   * 좋아요 / 싫어요 토글
   * - 같은 버튼을 다시 누르면 취소 (LIKE -> NONE, DISLIKE -> NONE)
   * - 다른 버튼을 누르면 전환 (LIKE -> DISLIKE, DISLIKE -> LIKE)
   * - 동시성:
   *   - 트랜잭션 + Post 행에 대해 pessimistic_write 락
   *   - 카운터(likeCount/dislikeCount) 일관성 보장
   */
  async togglePostReaction(
    userId: string,
    postId: string,
    reaction: PostReactionType,
  ): Promise<{
    post: Post;
    userReaction: PostReactionState;
  }> {
    if (reaction !== 'LIKE' && reaction !== 'DISLIKE') {
      throw new BadRequestException({
        code: 'INVALID_REACTION',
        message: 'reaction은 LIKE 또는 DISLIKE만 가능합니다.',
        details: { reaction },
      });
    }

    // 좋아요 row 변경과 Post의 좋아요, 싫어요 작업을 하나의 작업으로 묶기위한 트랜잭션 사용
    // pessimistic_write 락 이유 : 동시에 여러 요청이 같은 게시글에 대해 좋아요를 눌러도, 한 순간에는 한 트랜잭션만 post 수행하도록
    return this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(Post);
      const postLikesRepository = manager.getRepository(PostLike);

      // 1) 게시글 존재 + soft delete 제외 + 행 락
      const post = await postRepository.findOne({
        where: { id: postId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        throw new NotFoundException({
          code: 'POST_NOT_FOUND',
          message: '좋아요를 설정할 게시글을 찾을 수 없습니다.',
          details: { postId },
        });
      }

      // 2) 현재 유저의 반응 상태 조회 (같은 트랜잭션 안에서)
      let postLike = await postLikesRepository.findOne({
        where: { userId, postId },
        lock: { mode: 'pessimistic_write' },
      });

      // 초기 상태: NONE
      let nextUserReaction: PostReactionState = 'NONE';

      if (!postLike) {
        // 기존 반응 없음 → 새로 반응 추가
        postLike = postLikesRepository.create({
          userId,
          postId,
          reaction,
        });

        if (reaction === 'LIKE') {
          post.likeCount += 1;
          nextUserReaction = 'LIKE';
        } else {
          post.dislikeCount += 1;
          nextUserReaction = 'DISLIKE';
        }

        await postLikesRepository.save(postLike);
      } else if (postLike.reaction === reaction) {
        // 같은 버튼 다시 클릭 → 취소 처리 (NONE)
        if (reaction === 'LIKE') {
          post.likeCount = Math.max(0, post.likeCount - 1);
        } else {
          post.dislikeCount = Math.max(0, post.dislikeCount - 1);
        }

        await postLikesRepository.remove(postLike);
        nextUserReaction = 'NONE';
      } else {
        // 다른 버튼 클릭 → 전환 (LIKE <-> DISLIKE)
        if (reaction === 'LIKE') {
          post.likeCount += 1;
          post.dislikeCount = Math.max(0, post.dislikeCount - 1);
          postLike.reaction = 'LIKE';
          nextUserReaction = 'LIKE';
        } else {
          post.dislikeCount += 1;
          post.likeCount = Math.max(0, post.likeCount - 1);
          postLike.reaction = 'DISLIKE';
          nextUserReaction = 'DISLIKE';
        }

        await postLikesRepository.save(postLike);
      }

      await postRepository.save(post);

      return {
        post,
        userReaction: nextUserReaction,
      };
    });
  }

  /**
   * 현재 유저 기준 게시글의 반응 상태 조회 (상세 조회에서 사용)
   */
  async getPostReactionStatus(
    userId: string,
    postId: string,
  ): Promise<'LIKE' | 'DISLIKE' | 'NONE'> {
    const postLike = await this.postLikesRepository.findOne({
      where: { userId, postId },
    });

    if (!postLike) {
      return 'NONE';
    }
    return postLike.reaction;
  }
}
