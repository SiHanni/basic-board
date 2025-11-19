import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  postId!: string;

  @ApiProperty()
  authorId!: string;

  @ApiProperty({
    description: '댓글 깊이 (0=댓글, 1=대댓글)',
    example: 0,
  })
  depth!: number;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우)',
    nullable: true,
  })
  parentId?: string | null;

  @ApiProperty({
    description: '댓글 내용',
  })
  content!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
