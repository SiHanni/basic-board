import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; // 이거 * as 로 하는거랑 안하는거 차이가 뭐지, 그리고 왜 bcrypt를 썼지? 다른 옵션은 없었는가?, 인증 인가와 암호화
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>, // Repository란, InjectRepository란, 여기서 이걸 사용한 이유는?
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password } = dto;
    // 1. 중복 이메일 검사
    const existing = await this.userRepository.findOne({
      where: { email: email },
    });
    if (existing) {
      const err = new ConflictException({
        code: 'USER_EMAIL_CONFLICT',
        message: '이미 사용 중인 이메일입니다.',
        details: { email: email },
      });
      throw err;
    }

    // 2. 비밀번호 해시 (라운드 기본 12, 환경변수로 조절 가능)
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? '12');
    const passwordHash = await bcrypt.hash(password, saltRounds); // bcrypt 알고리즘 공부와 암호화, 그리고 왜 이걸 썻는지

    const user = this.userRepository.create({
      name: name,
      email: email,
      passwordHash,
      profileImageUrl: null,
    });
    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      profileImageUrl: saved.profileImageUrl ?? null,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
