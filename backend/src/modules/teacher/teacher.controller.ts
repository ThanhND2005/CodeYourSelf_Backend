import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { TeacherService } from './teacher.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';

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
  @Patch('patchImageCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('image'))
  async patchImageCourse (@Param('courseId') courseId: string, @UploadedFile() file: Express.Multer.File){
    if(!file)
    {
      throw new BadRequestException('Vui long chon anh dai dien')
    }
    const url = await this.teacherService.uploadImages2(file, courseId)
    return{
      url
    }
  }
  @Patch('patchImageMultipleCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('image2'))
  async patchImageMultipleCourse (@Param('courseId') courseId: string, @UploadedFile() file: Express.Multer.File){
    if(!file)
    {
      throw new BadRequestException('Vui long chon anh dai dien')
    }
    const url = await this.teacherService.uploadImages3(file, courseId)
    return{
      url
    }
  }
  @Patch('addCourse/:multipleCourseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addCourse(@Param('multipleCourseId') multipleCourseId : string, @Body() {courseId} : any) {
    await this.teacherService.addCourse(courseId,multipleCourseId)
    return{message:"ok"}
  }
  @Patch('removeCourse')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCourse(@Body() {courseId} : any) {
    await this.teacherService.removeCourse(courseId)
    return{message:"ok"}
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
  @Post('postMultipleCourse/:userId')
  @HttpCode(HttpStatus.CREATED)
  async posMultipletCourse(@Param('userId') userId: string,@Body() {name, cost, summary} : any) {
    await this.teacherService.postMultipleCourse(name,cost,summary,userId,0)
    return{message:'ok'}
  }
  @Post('postCourse/:userId')
  @HttpCode(HttpStatus.CREATED)
  async postCourse(@Param('userId') userId: string,@Body() {name, cost, summary} : any) {
    await this.teacherService.postCourse(name,cost,summary,userId,0)
    return{message:'ok'}
  }
  @Patch('patchCourse/:courseId')
  @HttpCode(HttpStatus.CREATED)
  async patchCourse(@Param('courseId') courseId: string,@Body() {name, cost, summary} : any) {
    await this.teacherService.patchCourse(courseId,name,cost,summary)
    return{message:'ok'}
  }
  @Patch('patchMultipleCourse/:courseId')
  @HttpCode(HttpStatus.CREATED)
  async patchMultipleCourse(@Param('courseId') courseId: string,@Body() {name, cost, summary} : any) {
    await this.teacherService.patchMultipleCourse(courseId,name,cost,summary)
    return{message:'ok'}
  }
  @Post('addVideo/:courseId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('video'))
  async addVideo(@Param('courseId') courseId: string, @UploadedFile() file : Express.Multer.File, @Body() {name}:any){
    await this.teacherService.addVideo(courseId,file,name)
    return{message:'ok'}
  }
  @Get('getVideo/:courseId')
  @HttpCode(HttpStatus.OK)
  async getVideo(@Param('courseId') courseId: string){
    const videos = await this.teacherService.getVideo(courseId)
    return{videos}
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
    
    return{singleCourses}
  }
  @Get('getMultipleCourses/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getMultipleCourses(@Param('teacherId') teacherId: string){
    const multipleCourses = await this.teacherService.getMultipleCoursesByTeacherId(teacherId)
    
    return{multipleCourses}
  }
  @Post('postNotification/:teacherId')
  @HttpCode(HttpStatus.CREATED)
  async postNotification(@Param('teacherId') teacherId: string, @Body() {title, content} : any){
    const students = await this.teacherService.getStudentsByTeacher(teacherId)
    const uniqueStudents = students.filter((student, index, self) => index === self.findIndex((t) => t.userId === student.userId))
    const notificationId = randomUUID();
    for(let i  =0;i< uniqueStudents.length;i++)
    {
        await this.teacherService.createNotification(title, content, teacherId, students[i].userId,notificationId)
    }
    return{message:'ok'}
  }
  @Get('getNotifications/:teacherId')
  @HttpCode(HttpStatus.OK)
  async getNotification(@Param('teacherId') teacherId: string){
    const notifications1= await this.teacherService.getNotifications(teacherId)
    const notifications2= await this.teacherService.getNotifications2(teacherId)
    const notifications = notifications1.concat(notifications2)
    return{notifications}
  }
  @Patch('deleteNotification/:notifId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('notifId') notifId : string){
    await this.teacherService.DeleteNotification(notifId)
  }
}
