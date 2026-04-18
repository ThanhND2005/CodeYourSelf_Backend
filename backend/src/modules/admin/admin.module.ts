import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TeacherModule } from '../teacher/teacher.module';

@Module({
  imports: [TeacherModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
