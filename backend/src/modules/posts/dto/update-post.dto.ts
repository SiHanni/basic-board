//import { ApiPropertyOptional } from '@nestjs/swagger';
//import { IsOptional, IsString, MaxLength } from 'class-validator';
//
//export class UpdatePostDto {
//  @ApiPropertyOptional({
//    example: '제목 수정합니다',
//    description: '수정할 게시글 제목',
//    maxLength: 200,
//  })
//  @IsOptional()
//  @IsString()
//  @MaxLength(200)
//  title?: string;
//
//  @ApiPropertyOptional({
//    example: '내용을 이렇게 수정합니다.',
//    description: '수정할 게시글 내용',
//  })
//  @IsOptional()
//  @IsString()
//  content?: string;
//}

import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
