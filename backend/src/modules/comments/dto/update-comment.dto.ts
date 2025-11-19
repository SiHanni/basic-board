import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: '수정할 댓글 내용',
    example: '내용을 조금 수정했습니다.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  content?: string;
}
