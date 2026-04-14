import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { FileInterceptor } from '@nestjs/platform-express';

interface User extends Request{
  user:{
    userId: string,
    role: string
  }
}
@Controller('apis/teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}
  @Patch('patchAvatar/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('avatar'))
  async patchAvatar (@Param('userId') userId: string, @UploadedFile() file: Express.Multer.File){
    if(!file)
    {
      throw new BadRequestException('Vui long chon anh dai dien')
    }
    const url = await this.teacherService.uploadImages(file, userId)
    return{
      url
    }
  }
  @Patch('patchInformation/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchInformation (@Param('userId') userId: string,@Body() {name, dob, address,phone, gender, bankName, bankAccount}: any){
    await this.teacherService.patchInformation(userId,name, dob,address,phone,gender,bankName,bankAccount)
    return{message:'oke'}
  }
  @Get('getInformation/:userId')
  @HttpCode(HttpStatus.OK)
  async getInformation (@Param('userId') userId: string){
    const teacher = await this.teacherService.getInformation(userId)
    return{teacher}
  }
  @Post('postCourse/:userId')
  @HttpCode(HttpStatus.CREATED)
  async postCourse(@Param('userId') userId: string,@Body() {name, cost, summary} : any) {
    await this.teacherService.postCourse(name,cost,summary,userId,0)
    return{message:'ok'}
  }
  @Post('addVideo/:courseId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('video'))
  async addVideo(@Param('courseId') courseId: string, @UploadedFile() file : Express.Multer.File, @Body() {name}:any){
    await this.teacherService.addVideo(courseId,file,name)
    return{message:'ok'}
  }
  @Patch('deleteCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('courseId') courseId: string){
    await this.teacherService.deleteCourse(courseId)
    return{message:'ok'}
  }
  @Get('getStudents/:courseId')
  @HttpCode(HttpStatus.OK)
  async getStudents(@Param('courseId') courseId: string){
    const students  = await this.teacherService.getStudents(courseId)
    return{students}
  }
  @Get('getStudentsByTeacher/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getStudentsByTeacher(@Param('teacherId') teacherId: string){
    const students  = await this.teacherService.getStudentsByTeacher(teacherId)
    return{students}
  }
  @Post('postComment/:courseId')
  @HttpCode(HttpStatus.OK)
  async postComment(@Param('courseId') courseId: string, @Body() {userId, content}: any){
    await this.teacherService.postComment(courseId,userId,content,new Date())
    return{message:'ok'}
  }
  @Get('getSingleCourses/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getSingleCourses(@Param('teacherId') teacherId: string){
    const singleCourses = await this.teacherService.getSingleCoursesByTeacherId(teacherId)
    console.log(singleCourses)
    return{singleCourses}
  }
  @Get('getMultipleCourses/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getMultipleCourses(@Param('teacherId') teacherId: string){
    const multipleCourses = await this.teacherService.getMultipleCoursesByTeacherId(teacherId)
    console.log(multipleCourses)
    return{multipleCourses}
  }
}
