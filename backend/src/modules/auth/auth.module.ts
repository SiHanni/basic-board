import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionModule } from '../../infra/session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SessionModule, // Redis 세션 사용
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
