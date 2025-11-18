import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'f8630fc8-4773-4e1f-a0d9-f3cde75d7edd' })
  id!: string;

  @ApiProperty({ example: 'LEE' })
  name!: string;

  @ApiProperty({ example: 'lee@test.com' })
  email!: string;

  @ApiProperty({
    example: null,
    nullable: true,
    description: '프로필 이미지 URL (없으면 null)',
  })
  profileImageUrl!: string | null;

  @ApiProperty({ example: '2025-11-08T04:58:16.560Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-11-08T04:58:16.560Z' })
  updatedAt!: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;
}
