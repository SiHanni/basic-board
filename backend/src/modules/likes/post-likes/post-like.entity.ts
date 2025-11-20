import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/user.entity';
import { Post } from '../../posts/post.entity';

export type PostReactionType = 'LIKE' | 'DISLIKE';

@Entity('post_likes')
@Index('uq_post_likes_user_post', ['userId', 'postId'], { unique: true })
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  postId!: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @Column({
    type: 'varchar',
    length: 10,
  })
  reaction!: PostReactionType; // 'LIKE' | 'DISLIKE'

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
