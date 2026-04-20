  import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, Query, Req, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/guards/auth.guard';

interface User extends Request{
  user: {
    userId: string, 
    role: string
  }
}
@UseGuards(AuthGuard)
@Controller('apis/student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}
  @Patch('patchAvatar/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('avatar'))
  async patchAvatar (@Param('userId') userId: string,@UploadedFile() file: Express.Multer.File){
    if(!file)
    {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện')
    }
    const url = await this.studentService.uploadImages(file, userId)
    return {
      message:'Update ảnh thành công',
      url
    }
  }
  @Get('searchCourse')
  @HttpCode(HttpStatus.OK)
  async searchCourse(@Query('searchTerm') searchTerm : string) {
    const courseSearchs=  await this.studentService.searchCourse(searchTerm)
    const multipleCourseSearchs = await this.studentService.searchMultipleCourse(searchTerm)
    return{
      courseSearchs,
      multipleCourseSearchs,
      message:'Thành công'
    }
  }
  @Get('getDetailCourse/:courseId')
  @HttpCode(HttpStatus.OK)
  async getDetailCourse(@Param('courseId') courseId: string){
    const course = await this.studentService.getDetailCourse(courseId)
    const lessons = await this.studentService.getCoursePaid(courseId)
    course.lessons = lessons
    return{
      course
    }
  }
  @Get('getDetailCourses/:courseId')
  @HttpCode(HttpStatus.OK)
  async getDetailCourses(@Param('courseId') courseId: string){
    const courses = await this.studentService.getDetailCourseById(courseId)
    for(let i  =0; i< courses.length;i++){
      const lessons = await this.studentService.getCoursePaid(courses[i].courseId)
      courses[i].lessons = lessons
    }
    return{
      courses
    }
  }
  @Get('getDetailMultipleCourse/:courseId')
  @HttpCode(HttpStatus.OK)
  async getDetailMultipleCourse(@Param('courseId') courseId: string){
    const multipleCourse = await this.studentService.getDetailMultipleCourse(courseId)
    return{
      multipleCourse
    }
  }
  @Get('getCoursePaid/:courseId')
  @HttpCode(HttpStatus.OK)
  async getCoursePaid(@Param('courseId') courseId : string){
    const videos = await this.studentService.getCoursePaid(courseId)
    return{videos}
  }
  @Patch('reviewCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reviewCourse(@Param('courseId') courseId: string, @Body() {courseScore} : any){
    const course = await this.studentService.getDetailCourse(courseId)
    const newScore = (course.rate + courseScore)/2
    await this.studentService.reviewCourse(newScore,courseId)
    return{message:'Đánh giá thành công'}
  }
  @Post('postComment/:courseId')
  @HttpCode(HttpStatus.CREATED)
  async postCommnet(@Param('courseId') courseId: string, @Body() {userId, content}: any){
    await this.studentService.postComment(courseId,userId,content, new Date())
    return{message:'Bình luận thành công'}
  }
  @Get('getInformation/:userId')
  @HttpCode(HttpStatus.OK)
  async getInformation(@Param('userId') userId : string){
    const student = await this.studentService.getInformation(userId)
    return{student}
  }
  @Patch('patchInformation/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchInformation (@Param('userId') userId: string,@Body() {name, dob,address, phone, gender }:any){
    await this.studentService.patchInformation(userId,name, dob,address,phone,gender)
    return{message:'Thành công'}
  }
  @Get('getTrendingCourse')
  @HttpCode(HttpStatus.OK)
  async getTrendingCourse (){
    const trendingCourses = await this.studentService.getTrendingCourse() 
    trendingCourses.sort((a,b) => b.rate-a.rate)
    return{trendingCourses}
  }
  @Get('getNewCourse')
  @HttpCode(HttpStatus.OK)
  async getNewCourse (){
    const newCourses = await this.studentService.getTrendingCourse() 
    newCourses.sort((a,b) => b.createdAt-a.createdAt)
    return{newCourses}
  }
  @Get('getNotification')
  
  @HttpCode(HttpStatus.OK)
  async getNotification (@Req() req : User) {
    const useId = req.user.userId
    const notifications = await this.studentService.getNotification(useId)
    return{notifications}
  }
  @Get('getProgressCourse')
  @HttpCode(HttpStatus.OK)
  async getProgressCourse(@Req() req : User){
    const userId = req.user.userId
    const progressCourse = await this.studentService.getProgressCourse(userId)
    return{progressCourse}
  }
  @Patch('patchCourse')
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchCourse(@Body() {courseId, rate} : any) {
    await this.studentService.patchRate(courseId, rate)
  }
}
