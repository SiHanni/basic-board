import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionModule } from '../../../infra/session/session.module';
import { User } from '../../users/user.entity';
import { Post } from '../../posts/post.entity';
import { PostLike } from './post-like.entity';
import { PostLikesService } from './post-likes.service';
import { PostLikesController } from './post-likes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostLike, Post, User]), SessionModule],
  providers: [PostLikesService],
  controllers: [PostLikesController],
  exports: [PostLikesService],
})
export class PostLikesModule {}
