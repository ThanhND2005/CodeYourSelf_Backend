import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, InternalServerErrorException, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import axios from 'axios'
import * as Minio from 'minio'
import { randomUUID } from 'crypto';
interface User extends Request{
  user:{
    userId: string,
    role: string

  }
}

@Controller('apis/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('getStudents')
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
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException
    }
  }
}
