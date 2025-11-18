import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '로그인할 사용자 이메일',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Str0ngP@ss1',
    description: '로그인 비밀번호(8자 이상)',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
