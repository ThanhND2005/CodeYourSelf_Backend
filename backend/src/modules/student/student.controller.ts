import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, Query, Req, UseGuards, InternalServerErrorException } from '@nestjs/common';
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
  @Get('searchSingleCourse')
  @HttpCode(HttpStatus.OK)
  async searchSingleCourse(@Query('searchTerm') searchTerm : string) {
    const courseSearchs=  await this.studentService.searchCourse(searchTerm)
    return{
      courseSearchs,
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
    const newScore = (course.rate*course.reviewer + courseScore)/(course.reviewer + 1)
    await this.studentService.reviewCourse(newScore,courseId,course.reviewer +1)
    return{message:'Đánh giá thành công'}
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
  @Get('getLessonProgress/:courseId')
  @HttpCode(HttpStatus.OK)
  async getLessonProgress (@Param('courseId') courseId : string, @Req() req : User)
  {
      const progress = await this.studentService.getProgressLesson(courseId,req.user.userId)
      return{progress}
  }
  @Patch('SyncProgress')
  @HttpCode(HttpStatus.NO_CONTENT)
  async SyncProgress (@Body() {videoId, currentTime, isCompleted} :any,@Req() req : User){
    await this.studentService.SyncProgress(videoId,currentTime,isCompleted,req.user.userId)
  }
  @Patch('patchCourseProgress/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchCourseProgress (@Param('courseId') courseId: string, @Req()  req : User){
    await this.studentService.patchCourseProgress(courseId,req.user.userId)
  }
  @Get('getMultipleCourseByStudentId')
  @HttpCode(HttpStatus.OK)
  async getMultipleCourseByStudentId (@Req() req : User){
    const multipleCourses = await this.studentService.getMultipleCourseById(req.user.userId)
    return{multipleCourses}
  }
  @Get('getBillSingleCourse/:courseId')
  @HttpCode(HttpStatus.OK)
  async getBillSingleCourse (@Param('courseId') courseId: string, @Req() req : User){
     const paymentId = await this.studentService.postPayment(courseId,req.user.userId)
     const payment =  await this.studentService.getPayment(paymentId)
     return{payment}
  }
  @Get('getBillMultipleCourse/:courseId')
  @HttpCode(HttpStatus.OK)
  async getBillMultipleCourse (@Param('courseId') courseId: string, @Req() req : User){
     const paymentId = await this.studentService.postPaymentMultiple(courseId,req.user.userId)
     const payment =  await this.studentService.getPayment(paymentId)
     return{payment}
  }
  @Post('getBillRoadmapCourse')
  @HttpCode(HttpStatus.OK)
  async getBillRoadmapCourse (@Body() {selectedCourseIds} : any,@Req() req : User){
    const paymentId = await this.studentService.postPaymentRoadmap(selectedCourseIds as string[],req.user.userId)
    const payment = await this.studentService.getPayment(paymentId)
    return{payment}
  }
  @Get('getBillSingleCourse2/:paymentId')
  @HttpCode(HttpStatus.OK)
  async getBillSingleCourse2 (@Param('paymentId') paymentId : string) {
    const payment = await this.studentService.getPayment(paymentId)
    return{payment}
  }
  @Post('PaymentSuccessRoadmap/:paymentId')
  @HttpCode(HttpStatus.CREATED)
  async PaymentSuccessRoadmap (@Param('paymentId') paymentId: string){
    const payment = await this.studentService.getPayment(paymentId)
    const student = await this.studentService.getInformation(payment.studentId as string)
    const courseIds = String(payment.courseId).split(',')
    for(let i =0;i<courseIds.length;i++){
      const course = await this.studentService.getDetailCourse(courseIds[i])
      console.log(course)
      await this.studentService.postNotificationCourse(course.teacherId,student.name,course.name,student.userId)
      await this.studentService.postCourseManagementSingle(payment.studentId,courseIds[i],'learning')
      const videos = await this.studentService.getCoursePaid(courseIds[i])
      
      for(let j =0;j<videos.length;j++){
        await this.studentService.postStudentVideoProgress(payment.studentId,videos[j].videoId,courseIds[i])
      }
    }
  }
  @Post('PaymentSucces/:paymentId')
  @HttpCode(HttpStatus.CREATED)
  async PaymentSucces (@Param('paymentId') paymentId: string){
    const payment = await this.studentService.getPayment(paymentId)
    await this.studentService.postCourseManagementSingle(payment.studentId, payment.courseId, 'learning')
    const videos = await this.studentService.getCoursePaid(payment.courseId as string)
    const student = await this.studentService.getInformation(payment.studentId as string)
    const course = await this.studentService.getDetailCourse(payment.courseId as string)
    await this.studentService.postNotificationCourse(course.teacherId,student.name,course.name,student.userId)
    for(let i = 0;i< videos.length;i++){
      await this.studentService.postStudentVideoProgress(payment.studentId, videos[i].videoId, payment.courseId)
    }
  }
  @Post('PaymentSuccess2/:paymentId')
  @HttpCode(HttpStatus.CREATED)
  async PaymentSuccess2 (@Param('paymentId') paymentId: string){
    const payment = await this.studentService.getPayment(paymentId)
    const student = await this.studentService.getInformation(payment.studentId as string)
    const multipleCourse = await this.studentService.getDetailMultipleCourse(payment.courseId as string)
    await this.studentService.postNotificationCourse(multipleCourse.teacherId,student.name,multipleCourse.name,payment.studentId)
    await this.studentService.postCourseManagementMultiple(payment.studentId,payment.courseId, 'learning')
  }
  @Post('postComment/:courseId')
  @HttpCode(HttpStatus.OK)
  async postComment(@Param('courseId') courseId: string, @Body() {content}: any,@Req() req :User){
    await this.studentService.postComment(courseId,req.user.userId,content)
    return{message:'ok'}
  }
  @Post('postReply/:commentId')
  @HttpCode(HttpStatus.OK)
  async postReply(@Param('commentId') commentId: string, @Body() {content}: any,@Req() req :User){
    await this.studentService.postReply(commentId,req.user.userId,content)
    return{message:'ok'}
  }
  @Get('getComment/:courseId')
  @HttpCode(HttpStatus.OK)
  async getComment(@Param('courseId') courseId: string){
    const comments = await this.studentService.getCommnet(courseId)
    return{comments}
  }
  @Get('getReply/:commentId')
  @HttpCode(HttpStatus.OK)
  async getReply(@Param('commentId') commentId: string){
    const replies = await this.studentService.getReply(commentId)
    return{replies}
  }
  @Patch('updateScore')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateScore (@Req() req : User, @Body() {videoId, score} : any){
    await this.studentService.updateScore(videoId,score,req.user.userId)
  }
  @Get('getQuestions/:videoId')
  @HttpCode(HttpStatus.OK)
  async getQuestionsByVideo (@Param('videoId') videoId: string){
    const questions = await this.studentService.getQuestionsByVideo(videoId)
    return{questions}
  }
}
