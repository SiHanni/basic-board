import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // imports, exports, providers, controllers 각각 기능과 역할, 등등
  controllers: [UsersController], // 컨트롤러는 프로바이더가 아닌가? 애초에 이 물음을 던졌다는건 프로바이더에 대해 뭔지 모른다는 것이다. 공부해야한다
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
