import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { Comment } from '../../comments/comment.entity';
import { CommentLike, CommentReactionType } from './comment-like.entity';

export type CommentReactionState = CommentReactionType | 'NONE';

@Injectable()
export class CommentLikesService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(CommentLike)
    private readonly commentLikesRepository: Repository<CommentLike>,
  ) {}

  /**
   * 댓글 좋아요 / 싫어요 토글
   * - 같은 버튼을 다시 누르면 취소 (LIKE -> NONE, DISLIKE -> NONE)
   * - 다른 버튼을 누르면 전환 (LIKE -> DISLIKE, DISLIKE -> LIKE)
   * - 동시성 제어
   *   - 트랜잭션 + Comment 행에 대해 pessimistic_write 락
   *   - likeCount / dislikeCount 정합성 보장
   */
  async toggleCommentReaction(
    userId: string,
    commentId: string,
    reaction: CommentReactionType,
  ): Promise<{
    comment: Comment;
    userReaction: CommentReactionState;
  }> {
    if (reaction !== 'LIKE' && reaction !== 'DISLIKE') {
      throw new BadRequestException({
        code: 'INVALID_REACTION',
        message: 'reaction은 LIKE 또는 DISLIKE만 가능합니다.',
        details: { reaction },
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const commentLikesRepository = manager.getRepository(CommentLike);

      // 1) 댓글 존재 + soft delete 제외 + 행 락
      const comment = await commentRepository.findOne({
        where: { id: commentId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!comment) {
        throw new NotFoundException({
          code: 'COMMENT_NOT_FOUND',
          message: '좋아요를 설정할 댓글을 찾을 수 없습니다.',
          details: { commentId },
        });
      }

      // 2) 현재 유저의 반응 상태 조회 (같은 트랜잭션 안에서)
      let commentLike = await commentLikesRepository.findOne({
        where: { userId, commentId },
        lock: { mode: 'pessimistic_write' },
      });

      let nextUserReaction: CommentReactionState = 'NONE';

      if (!commentLike) {
        // 기존 반응 없음 → 새로 반응 추가
        commentLike = commentLikesRepository.create({
          userId,
          commentId,
          reaction,
        });

        if (reaction === 'LIKE') {
          comment.likeCount += 1;
          nextUserReaction = 'LIKE';
        } else {
          comment.dislikeCount += 1;
          nextUserReaction = 'DISLIKE';
        }

        await commentLikesRepository.save(commentLike);
      } else if (commentLike.reaction === reaction) {
        // 같은 버튼 다시 클릭 → 취소
        if (reaction === 'LIKE') {
          comment.likeCount = Math.max(0, comment.likeCount - 1);
        } else {
          comment.dislikeCount = Math.max(0, comment.dislikeCount - 1);
        }

        await commentLikesRepository.remove(commentLike);
        nextUserReaction = 'NONE';
      } else {
        // 다른 버튼 클릭 → 전환 (LIKE <-> DISLIKE)
        if (reaction === 'LIKE') {
          comment.likeCount += 1;
          comment.dislikeCount = Math.max(0, comment.dislikeCount - 1);
          commentLike.reaction = 'LIKE';
          nextUserReaction = 'LIKE';
        } else {
          comment.dislikeCount += 1;
          comment.likeCount = Math.max(0, comment.likeCount - 1);
          commentLike.reaction = 'DISLIKE';
          nextUserReaction = 'DISLIKE';
        }

        await commentLikesRepository.save(commentLike);
      }

      await commentRepository.save(comment);

      return {
        comment,
        userReaction: nextUserReaction,
      };
    });
  }

  /**
   * 현재 유저 기준 댓글의 반응 상태 조회
   * - 댓글 상세 조회, 댓글 목록 응답 등에 재사용 가능
   */
  async getCommentReactionStatus(
    userId: string,
    commentId: string,
  ): Promise<CommentReactionState> {
    const commentLike = await this.commentLikesRepository.findOne({
      where: { userId, commentId },
    });

    if (!commentLike) {
      return 'NONE';
    }
    return commentLike.reaction;
  }
}
