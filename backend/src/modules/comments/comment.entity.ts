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
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';

@Entity('comments')
// WHERE postId=? AND createdAt< ? ORDER BY createdAt DESC LIMIT N 전용
@Index('idx_comments_post_createdAt', ['postId', 'createdAt']) // 인덱스 설계 근거 , 여기도 write가 상당한 테이블인데
// 대댓글 목록을 스레드(parentId)별 시간순으로 뽑는 패턴 최적화, 대댓글이 드물다면 이 인덱스를 없애고 단일 parentId 인덱스만으로 충분
@Index('idx_comments_parent_createdAt', ['parentId', 'createdAt']) // 인덱스 설계 근거
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  postId!: string;

  // 고아 레코드 방지. Post가 지워지면 댓글도 함께 제거할 때 사용하는 옵션
  // 단, 한번에 많은 댓글이 지워질 떄 락, 트랜잭션 시간 증가 가능함. 대량 삭제가 빈번하다면 soft delete -> 배치 물리삭제로 분리
  @ManyToOne(() => Post, { onDelete: 'CASCADE' }) // cascade를 정확히 이해하고있는가 그리고 왜 이렇게 했는가
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @Column({ type: 'uuid' })
  authorId!: string;

  // 유저 삭제시 해당 유저의 댓글이 남아있다면 유저 삭제 불가. 자식이 있다면 부모 삭제 금지
  @ManyToOne(() => User, { onDelete: 'RESTRICT' }) // restrict를 제대로 알고 쓴건가
  @JoinColumn({ name: 'authorId' })
  author!: User;

  // depth 0=댓글, 1=대댓글 (요구사항)
  @Column({ type: 'tinyint', unsigned: true, default: 0 }) // 이건 타입을 이렇게 해둔 이유가 뭔가
  depth!: number;

  // 대댓글 연결(최상위 댓글의 id), depth=0이면 null
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Comment, (parent) => parent.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment | null;

  @Column({ type: 'text' })
  content!: string;

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

  // 역참고, 대댓글(depth = 1)
  @OneToMany(() => Comment, (reply) => reply.parent)
  replies!: Comment[];
}
