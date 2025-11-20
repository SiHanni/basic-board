import { Module } from '@nestjs/common';

import { PostLikesModule } from './post-likes/post-likes.module';
//import { ReplyLikesModule } from './reply-likes/reply-likes.module';

@Module({
  imports: [
    PostLikesModule,
    //ReplyLikesModule,
  ],
  // 필요하면 여기서 공통 서비스/가드 등을 providers에 두고 export 할 수도 있음
  exports: [
    PostLikesModule,
    //ReplyLikesModule,
  ],
})
export class LikesModule {}
