import { ApiProperty } from '@nestjs/swagger';

/** API 응답에서 노출되는 유저 정보 표준화(비밀번호 해시 제거) */
export class UserResponseDto {
  @ApiProperty({ example: 'c3f02b07-6a8a-4a1e-9f7d-6c9b9a2b4a5f' })
  id!: string;

  @ApiProperty({ example: 'Lee' })
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: null, nullable: true })
  profileImageUrl?: string | null;

  @ApiProperty({ example: '2025-11-06T07:12:34.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-11-06T07:12:34.000Z' })
  updatedAt!: string;
}
