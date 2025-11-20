import { ApiProperty } from '@nestjs/swagger';

export class CommentLikeStatusResponseDto {
  @ApiProperty({
    description: '대상 댓글 ID',
    example: '2d6f4c7b-1234-4a8e-bc9a-ef567890abcd',
  })
  commentId!: string;

  @ApiProperty({
    description: '해당 댓글의 좋아요 개수',
    example: 10,
  })
  likeCount!: number;

  @ApiProperty({
    description: '해당 댓글의 싫어요 개수',
    example: 2,
  })
  dislikeCount!: number;

  @ApiProperty({
    description: "현재 유저의 반응 상태 ('LIKE' | 'DISLIKE' | 'NONE')",
    enum: ['LIKE', 'DISLIKE', 'NONE'],
    example: 'LIKE',
  })
  userReaction!: 'LIKE' | 'DISLIKE' | 'NONE';
}
