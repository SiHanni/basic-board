import { ApiProperty } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  authorId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ description: '조회수', example: 0 })
  viewCount!: number;

  @ApiProperty({ description: '좋아요 수', example: 0 })
  likeCount!: number;

  @ApiProperty({ description: '싫어요 수', example: 0 })
  dislikeCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
