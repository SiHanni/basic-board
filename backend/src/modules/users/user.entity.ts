import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('idx_users_email_unique', ['email'], { unique: true }) // index 공부, index 개념, index 설정과 튜닝, 등 5-why
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 }) // varchar 이란?
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
}
