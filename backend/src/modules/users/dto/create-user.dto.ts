import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Lee SiHwan', maxLength: 120 })
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'user@example.com', maxLength: 190 })
  @IsEmail()
  @MaxLength(190)
  email!: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd',
    minLength: 8,
    description: '클라이언트 평문 입력 → 서버에서 해시 보관',
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72) // bcrypt 권장 상한
  password!: string;
}
