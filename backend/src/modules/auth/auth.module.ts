import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database.module';
@Module({
  imports:[DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}