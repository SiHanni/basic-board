import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/user.entity';
import { Comment } from '../../comments/comment.entity';

export type CommentReactionType = 'LIKE' | 'DISLIKE';

@Entity('comment_likes')
@Index('uq_comment_likes_user_comment', ['userId', 'commentId'], {
  unique: true,
})
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  commentId!: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment!: Comment;

  @Column({ type: 'varchar', length: 10 })
  reaction!: CommentReactionType; // 'LIKE' | 'DISLIKE'

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
