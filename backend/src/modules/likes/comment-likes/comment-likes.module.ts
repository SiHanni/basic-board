import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentLike } from './comment-like.entity';
import { Comment } from '../../comments/comment.entity';
import { CommentLikesService } from './comment-likes.service';
import { CommentLikesController } from './comment-likes.controller';
import { SessionModule } from '../../../infra/session/session.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentLike, Comment]), SessionModule],
  controllers: [CommentLikesController],
  providers: [CommentLikesService],
  exports: [CommentLikesService],
})
export class CommentLikesModule {}
