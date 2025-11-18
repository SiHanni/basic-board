import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';

import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    const { title, content } = dto;
    const post = this.postsRepository.create({
      authorId,
      title,
      content,
    });

    return this.postsRepository.save(post);
  }

  async findOneOrFail(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '해당 게시글을 찾을 수 없습니다.',
        details: { id },
      });
    }
    return post;
  }

  /**
   * 단건 조회 + 조회수 1 증가
   */
  async getAndIncreaseViewCount(id: string): Promise<Post> {
    // 존재하지 않으면 NotFound 먼저 체크
    await this.findOneOrFail(id);

    // 조회수 1 증가 (soft delete 된 건은 findOneOrFail에서 이미 걸러짐)
    await this.postsRepository.increment({ id }, 'viewCount', 1);

    // 최신 상태 다시 조회해서 리턴
    return this.findOneOrFail(id);
  }

  /** 기본값 문법을 통해 매개변수의 기본값을 지정, controller에서 따로 넘어오는 값이 없다면 기본값으로 처리 */
  // 페이지네이션 방법 1
  //async findMany(
  //  page = 1,
  //  limit = 10,
  //): Promise<{ items: Post[]; total: number }> {
  //  const [items, total] = await this.postsRepository.findAndCount({
  //    where: {},
  //    order: { createdAt: 'DESC' },
  //    skip: (page - 1) * limit,
  //    take: limit,
  //  });
  //
  //  return { items, total };
  //}

  // 방법 2
  async list(query: ListPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const keyword = query.keyword?.trim();

    // 공통 where: 삭제되지 않은 게시글만
    const baseWhere = { deletedAt: IsNull() as any };

    let items: Post[];
    let total: number;

    if (keyword && keyword.length > 0) {
      const likePattern = `%${keyword}%`;

      // 제목 OR 내용에 검색어가 포함된 글만
      [items, total] = await this.postsRepository.findAndCount({
        where: [
          { ...baseWhere, title: Like(likePattern) },
          { ...baseWhere, content: Like(likePattern) },
        ],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      // 검색어 없으면 전체 목록
      [items, total] = await this.postsRepository.findAndCount({
        where: baseWhere,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async update(
    id: string,
    authorId: string,
    dto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.findOneOrFail(id);

    if (post.authorId !== authorId) {
      throw new ForbiddenException({
        code: 'POST_FORBIDDEN',
        message: '본인이 작성한 게시글만 수정할 수 있습니다.',
        details: { postId: id },
      });
    }

    if (dto.title !== undefined) {
      post.title = dto.title;
    }
    if (dto.content !== undefined) {
      post.content = dto.content;
    }

    return this.postsRepository.save(post);
  }

  async remove(id: string, authorId: string): Promise<void> {
    const post = await this.findOneOrFail(id);

    if (post.authorId !== authorId) {
      throw new ForbiddenException({
        code: 'POST_FORBIDDEN',
        message: '본인이 작성한 게시글만 삭제할 수 있습니다.',
        details: { postId: id },
      });
    }

    // 둘의 차이에 대해 공부할 것
    // soft delete (deletedAt 사용)
    //await this.postsRepository.softDelete(id);
    // soft delete (DeleteDateColumn 사용)
    await this.postsRepository.softRemove(post);
  }
}
