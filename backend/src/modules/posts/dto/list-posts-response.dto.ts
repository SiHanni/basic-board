import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from './post-response.dto';

class PaginationMetaDto {
  @ApiProperty({ description: '전체 게시글 수', example: 123 })
  total!: number;

  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  page!: number;

  @ApiProperty({ description: '페이지당 개수', example: 10 })
  limit!: number;

  @ApiProperty({ description: '전체 페이지 수', example: 13 })
  totalPages!: number;
}

export class ListPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  items!: PostResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination!: PaginationMetaDto;
}
