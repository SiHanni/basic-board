import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Comment } from '../comments/comment.entity';
import { PostLike } from '../likes/post-likes/post-like.entity';

@Entity('posts')
@Index('idx_posts_author_createdAt', ['authorId', 'createdAt'])
@Index('idx_posts_createdAt', ['createdAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  // 조회수/좋아요 수는 합계 캐싱용(정합성은 트랜잭션에서 관리)
  @Column({ type: 'int', unsigned: true, default: 0 })
  viewCount!: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  likeCount!: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  dislikeCount!: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  // 역참고
  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  postLikes!: PostLike[];
}
