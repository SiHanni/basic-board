import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from './comment.entity';
import { Post } from '../posts/post.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { SessionModule } from '../../infra/session/session.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post, User]), SessionModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
