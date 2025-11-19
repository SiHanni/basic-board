import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({ description: '좋아요할 게시글 ID' })
  @IsUUID()
  postId!: string;
}
