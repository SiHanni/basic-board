import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListPostsQueryDto {
  @ApiProperty({
    description: '페이지 번호 (1부터 시작)',
    required: false,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: '페이지당 게시글 수',
    required: false,
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: '검색어 (제목 / 내용 부분 일치 검색)',
    required: false,
    example: 'NestJS',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
