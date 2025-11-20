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

  @ApiProperty({
    description: '요청한 사용자가 이 게시글에 좋아요를 눌렀는지 여부',
    example: false,
  })
  userLiked!: boolean;

  @ApiProperty({
    description: '요청한 사용자가 이 게시글에 싫어요를 눌렀는지 여부',
    example: false,
  })
  userDisliked!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
