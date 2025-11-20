import { ApiProperty } from '@nestjs/swagger';

export class PostLikeStatusResponseDto {
  @ApiProperty()
  postId!: string;

  @ApiProperty({ description: '좋아요 개수', example: 10 })
  likeCount!: number;

  @ApiProperty({ description: '싫어요 개수', example: 2 })
  dislikeCount!: number;

  @ApiProperty({
    description: '현재 유저의 반응 상태',
    example: 'LIKE',
    enum: ['LIKE', 'DISLIKE', 'NONE'],
  })
  userReaction!: 'LIKE' | 'DISLIKE' | 'NONE';
}
