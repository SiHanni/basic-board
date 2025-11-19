import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** 댓글 리스트 조회용 DTO */
export class ListCommentsByPostQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (기본값 1)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 당 댓글 수 (기본값 10)',
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  // 필요 시 확장할 필터용 필드들 (예: depth 등)을 여기에 추가 가능
}
