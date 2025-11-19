import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ToggleLikeDto {
  @ApiProperty({ description: '좋아요 토글할 게시글 ID' })
  @IsUUID()
  postId!: string;
}
