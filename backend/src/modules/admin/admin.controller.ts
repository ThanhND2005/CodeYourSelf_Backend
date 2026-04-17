import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, InternalServerErrorException, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { randomUUID } from 'crypto';
import { PaymentDto } from './dto/create-admin.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/role.decorator';
interface User extends Request{
  user:{
    userId: string,
    role: string

  }
}

@Controller('apis/admin')
@UseGuards(AuthGuard,RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('getStudents')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async getStudents (){
    try {
      const students = await this.adminService.getStudents()
      return {
        students,
        mess:"Đăng nhập thành công!"
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Patch('deleteStudent/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStudent(@Param('userId') userId: string){
    try {
      await this.adminService.deleteStudent(userId)
      return {message:'Xóa học sinh thành công'}
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getTeachers')
  @HttpCode(HttpStatus.OK)
  async getTeachers(){
    try {
      const teachers = await this.adminService.getTeachers()
      return {
        teachers,
        message:'Lấy thông tin giáo viên thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Patch('deleteTeacher/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeache(@Param('userId') userId: string){
    try {
      await this.adminService.deleteTeacher(userId)
      return{
        message: 'Xóa giáo viên thành công.'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getNotifications')
  @HttpCode(HttpStatus.OK)
  async getNotifications (@Req() req: User){
    try {
      const user = req.user 
      const notifications = await this.adminService.getNotifications(user.userId)
      return {
        notifications,
        message:'Lấy thông báo thành công'
      }

    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Patch('deleteNotification/:notificationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('notificationId') notificationId: string){
    try {
      await this.adminService.deleteNotification(notificationId)
      return {
        message:'Xóa thông báo thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getWaitCourses')
  @HttpCode(HttpStatus.OK)
  async getWaitCourses(){
    try {
      const waitCourses = await this.adminService.getWaitCourses()
      return{
        waitCourses,
        message:"Lấy thành công danh sách các khóa học đang chờ"
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getWaitMultipleCourses')
  @HttpCode(HttpStatus.OK)
  async getWaitMultipleCourses(){
    try {
      const waitMultipleCourses = await this.adminService.getWaitMultipleCourses()
      return{
        waitMultipleCourses,
        message:"Lấy thành công danh sách các khóa học đang chờ"
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getStudentBills')
  @HttpCode(HttpStatus.OK)
  async getStudentBills(){
    try {
      const studentBills = await this.adminService.getStudentBills()
      return{
        studentBills,
        message:'Lấy danh sách hóa đơn thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Post('postSalary')
  @HttpCode(HttpStatus.CREATED)
  async postSalary() {
    try {
      const teachers = await this.adminService.getTeachers()
      for(let i = 0;i<teachers.length;i++){
        const teacher = teachers[i]
        const courses = await this.adminService.getCourseById(teacher.userId)
        let amount = 0
        for(let j = 0;j<courses.length;j++)
        {
          amount += courses[j].amount
        }
        const salaryId = randomUUID()
        await this.adminService.postSalary(salaryId,new Date(),amount,teacher.userId)
        return{
          message:'Tạo hóa đơn lượng thành công'
        }
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getSalary')
  @HttpCode(HttpStatus.OK)
  async getSalary () {
    try {
      const teacherBills = await this.adminService.getSalary()
      return{
        teacherBills,
        message:'Lấy hóa đơn thành công!'
      }
      
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Patch('deleteStudentBill/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStudentBill (@Param('paymentId') paymentId: string) {
    try {
      await this.adminService.deleteStudentBill(paymentId)
      return{
        message:'Xóa hóa đơn thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Patch('acceptWaitCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptWaitCourse (@Param('courseId') courseId: string){
    try {
      await this.adminService.acceptWaitCourse(courseId)
      return{
        message:'Duyệt code thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Patch('acceptWaitMultipleCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptWaitMultipleCourse (@Param('courseId') courseId: string){
    try {
      await this.adminService.acceptWaitMultipleCourse(courseId)
      return{
        message:'Duyệt code thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Delete('denyWaitCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async denyWaitCourse (@Param('courseId') courseId: string){
    try {
      await this.adminService.denyWaitCourse(courseId)
      return{
        message:'Xóa khóa học thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Delete('denyWaitMultipleCourse/:courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async denyWaitMultipleCourse (@Param('courseId') courseId: string){
    try {
      await this.adminService.denyWaitMultipleCourse(courseId)
      return{
        message:'Xóa khóa học thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Post('postStudentBill')
  @HttpCode(HttpStatus.CREATED)
  async postStudentBill (@Body() paymentDto: PaymentDto){
    try {
      const {courseId,studentId,amount} = paymentDto
      const paymentId = randomUUID()
      const payment = await this.adminService.postStudentBill(paymentId,new Date(),amount,courseId,studentId)
      return{
        payment,
        message:'Tạo hóa đơn thành công'
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
  @Get('getCourses')
  @HttpCode(HttpStatus.OK)
  async getCourses () {
    const courses = await this.adminService.getCourses()
    return{courses}
  }
  @Get('ReceiveNotification')
  @HttpCode(HttpStatus.OK)
  async ReceiveNotification () {
    const receivedNotifications = await this.adminService.getNotificationReceived()
    return{receivedNotifications}
  }
  @Patch('patchTeacher/:teacherId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchTeacher(@Param('teacherId') teacherId: string, @Body() {name, dob, address,phone, gender} : any) {
    await this.adminService.patchTeacher(teacherId,name,dob,address,phone, gender)
  }
  @Post('postNotification')
  @HttpCode(HttpStatus.CREATED)
  async postNotification(@Body() {role, title, content} : any){
    if(role == "Giáo viên"){
      const teachers = await this.adminService.getTeachers()
      const teacherIds = teachers.map(teacher => teacher.userId)
      const notificationId = randomUUID();
      await this.adminService.createNotification(title,content,'99fdb54e-27e2-11f1-a6e5-2e8453cbf53b','admin',teacherIds,'teacher',notificationId)
      return{message:'ok'}
    }
    else if(role== "Học sinh"){
      const students = await this.adminService.getStudents()
      const studentIds = students.map(student => student.userId as string)
      const notificationId = randomUUID();
      await this.adminService.createNotification(title,content,'99fdb54e-27e2-11f1-a6e5-2e8453cbf53b','admin',studentIds,'student',notificationId)
      return{message:'ok'}
    }
    else if(role=="Tất cả"){
      const teachers = await this.adminService.getTeachers()
      const teacherIds = teachers.map(teacher => teacher.userId)
      const students = await this.adminService.getStudents()
      const studentIds = students.map(student => student.userId as string)
      const notificationId1 = randomUUID();
      const notificationId2 = randomUUID();
      await this.adminService.createNotification(title,content,'99fdb54e-27e2-11f1-a6e5-2e8453cbf53b','admin',teacherIds,'teacher',notificationId1)
      await this.adminService.createNotification(title,content,'99fdb54e-27e2-11f1-a6e5-2e8453cbf53b','admin',studentIds,'student',notificationId2)
      return{message:'ok'}
    }
  }
}
