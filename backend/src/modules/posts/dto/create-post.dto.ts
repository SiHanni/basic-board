import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: '게시글',
    description: '게시글 제목 (최대 200자)',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: '내용',
    description: '게시글 본문',
  })
  @IsString()
  content!: string;
}
