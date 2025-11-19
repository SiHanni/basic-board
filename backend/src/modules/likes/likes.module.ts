import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Like } from './like.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';

import { SessionModule } from '../../infra/session/session.module';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Post, User]), SessionModule],
  providers: [LikesService],
  controllers: [LikesController],
})
export class LikesModule {}
