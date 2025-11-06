import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';

@Entity('comments')
@Index('idx_comments_post_createdAt', ['postId', 'createdAt']) // 인덱스 설계 근거 , 여기도 write가 상당한 테이블인데
@Index('idx_comments_parent_createdAt', ['parentId', 'createdAt']) // 인덱스 설계 근거
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  postId!: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' }) // cascade를 정확히 이해하고있는가 그리고 왜 이렇게 했는가
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @Column({ type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' }) // restrict를 제대로 알고 쓴건가
  @JoinColumn({ name: 'authorId' })
  author!: User;

  // depth 0=댓글, 1=대댓글 (요구사항)
  @Column({ type: 'tinyint', unsigned: true, default: 0 }) // 이건 타입을 이렇게 해둔 이유가 뭔가
  depth!: number;

  // 대댓글 연결(최상위 댓글의 id), depth=0이면 null
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: Date | null;
}
