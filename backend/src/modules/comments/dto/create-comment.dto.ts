import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글을 작성할 게시글 ID',
    format: 'uuid',
  })
  @IsUUID()
  postId!: string;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우에만 지정)',
    format: 'uuid',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string | null;

  @ApiProperty({
    description: '댓글 내용',
    example: '좋은 글 감사합니다!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}
