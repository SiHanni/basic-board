import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // imports, exports, providers, controllers 각각 기능과 역할, 등등
  exports: [TypeOrmModule],
})
export class UsersModule {}
