import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from './post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { SessionModule } from '../../infra/session/session.module';
import { User } from '../users/user.entity';
import { PostLike } from '../likes/post-likes/post-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, PostLike]), SessionModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
