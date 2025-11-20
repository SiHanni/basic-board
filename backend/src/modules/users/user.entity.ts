import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';
import { Comment } from '../comments/comment.entity';
import { PostLike } from '../likes/post-likes/post-like.entity';

@Entity('users')
@Index('idx_users_email_unique', ['email'], { unique: true }) // index 공부, index 개념, index 설정과 튜닝, 등 5-why
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // varchar 이란? "Variable Character", 가변 길이 문자열을 저장하기 위한 데이터 타입
  // 글자 수가 일정하지 않은 문자열을 저장할 때 사용하는 타입
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 190, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  passwordHash!: string;

  // 프로필 이미지 컬럼은 당장 미사용이지만, 스키마만 준비
  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImageUrl?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  // 역방향 참고
  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  postLikes!: PostLike[];
}
