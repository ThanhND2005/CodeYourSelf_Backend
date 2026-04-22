import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise'
import * as Minio from 'minio'
import { Course, CourseVideo, MultipleCourse, Student } from './dto/create-student.dto';
import { randomUUID } from 'node:crypto';
import axios from 'axios';

@Injectable()
export class StudentService {
  private readonly minioClinent: Minio.Client
  private readonly bucketName = 'images'
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool,
  ) {
    this.minioClinent = new Minio.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'admin',
      secretKey: 'admin12345'
    })
  }
  async searchCourse(searchTerm: string): Promise<Course[]> {
    try {

      const searchPattern = `%${searchTerm.toLowerCase()}%`;

      const [rows] = await this.db.execute<Course[]>(
        `SELECT c.courseId, c.name, c.imageUrl, c.cost, c.rate, t.name as teacherName
       FROM Course c
       JOIN Teacher t on t.userId = c.teacherId
       -- Sử dụng LOWER() để so sánh không phân biệt hoa/thường
       WHERE LOWER(c.name) LIKE ? OR LOWER(c.summary) LIKE ?`,
        [searchPattern, searchPattern]
      );
      return rows;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi hệ thống');
    }
  }
  async searchMultipleCourse(searchTerm: string): Promise<MultipleCourse[]> {
    try {

      const searchPattern = `%${searchTerm.toLowerCase()}%`;

      const [rows] = await this.db.execute<MultipleCourse[]>(
        `SELECT c.multipleCourseId, c.name, c.imageUrl, c.cost, c.rate, t.name as teacherName
       FROM MultipleCourse c
       JOIN Teacher t on t.userId = c.teacherId
       -- Sử dụng LOWER() để so sánh không phân biệt hoa/thường
       WHERE LOWER(c.name) LIKE ? OR LOWER(c.sumary) LIKE ?`,
        [searchPattern, searchPattern]
      );
      return rows;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi hệ thống');
    }
  }
  async getDetailCourse(courseId: string): Promise<Course> {
    try {
      const [rows] = await this.db.execute<Course[]>(
        `SELECT c.*, t.name as teacherName FROM Course c JOIN Teacher t on t.userId = c.teacherId WHERE c.deleted=0 AND c.courseId=?`, [courseId]
      )
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getDetailCourseById(courseId: string): Promise<Course[]> {
    try {
      const [rows] = await this.db.execute<Course[]>(
        `SELECT c.*,t.name as teacherName FROM Course c JOIN Teacher t on t.userId = c.teacherId WHERE c.deleted=0 AND c.multipleCourseId=?`, [courseId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getDetailMultipleCourse(multipleCourseId: string): Promise<MultipleCourse> {
    try {
      const [rows] = await this.db.execute<MultipleCourse[]>(
        `SELECT * FROM MultipleCourse WHERE deleted=0 AND multipleCourseId=?`, [multipleCourseId]
      )
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getCoursePaid(courseId: string): Promise<CourseVideo[]> {
    try {
      const [rows] = await this.db.execute<CourseVideo[]>(
        `SELECT * FROM CourseVideo WHERE deleted=0 AND courseId = ?`, [courseId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async reviewCourse(courseScore: number, courseId: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE Course SET rate=? WHERE courseId=?', [courseScore, courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async postComment(courseId: string, userId: string, content: string, createdAt: Date): Promise<void> {
    try {
      await this.db.execute(
        'INSERT INTO Comment (userId, courseId, content, createdAt) VALUES (?,?,?,?)', [userId, courseId, content, createdAt]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getInformation(userId: string): Promise<Student> {
    try {
      const [rows] = await this.db.execute<Student[]>(
        'SELECT * FROM Student WHERE userId=? AND deleted=0', [userId]
      )
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async patchInformation(userId: string, name: string, dob: Date, address: string, phone: string, gender: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE Student SET name=?,dob=?,address=?,phone=?,gender=? WHERE userId=?', [name, dob, address, phone, gender, userId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async uploadImages(file: Express.Multer.File, userId: string): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    try {
      await this.minioClinent.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      )
      const avatarUrl = `http://localhost:9000/${this.bucketName}/${fileName}`;
      await this.db.execute(
        'UPDATE Student SET avatarUrl=? WHERE userId=?', [avatarUrl, userId]
      )
      return avatarUrl
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getTrendingCourse(): Promise<mysql.RowDataPacket[]> {
    const [rows1] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT c.courseId, c.name, c.cost,c.summary,c.teacherId,t.name as teacherName,c.rate,c.imageUrl,'false' as isMultiple FROM Course c JOIN Teacher t on c.teacherId = t.userId ORDER BY c.rate DESC LIMIT 10`, []
    )
    const [rows2] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT c.multipleCourseId as courseId, c.name, c.cost,c.sumary as summary,c.teacherId,t.name as teacherName,c.rate,c.imageUrl,'true' as isMultiple FROM MultipleCourse c JOIN Teacher t on t.userId = c.teacherId ORDER BY c.rate DESC LIMIT 10`, []
    )
    const rows = rows1.concat(rows2)
    return rows
  }
  async getNewCourse(): Promise<mysql.RowDataPacket[]> {
    const [rows1] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT c.courseId, c.name, c.cost,c.summary,c.teacherId,t.name as teacherName,c.rate,c.imageUrl,'false' as isMultiple,c.createdAt FROM Course c JOIN Teacher t on c.teacherId = t.userId ORDER BY c.createdAt DESC LIMIT 10`, []
    )
    const [rows2] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT c.multipleCourseId as courseId, c.name, c.cost,c.sumary as summary,c.teacherId,t.name as teacherName,c.rate,c.imageUrl,'true' as isMultiple,c.createdAt FROM MultipleCourse c JOIN Teacher t on t.userId = c.teacherId ORDER BY c.createdAt DESC LIMIT 10`, []
    )
    const rows = rows1.concat(rows2)
    return rows
  }
  async getNotification(userId: string): Promise<mysql.RowDataPacket[]> {
    const [rows] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT n.* FROM Notification n JOIN NotificationManagement m on m.notificationId = n.notificationId WHERE receiverId = ?`, [userId]
    )
    return rows
  }
  async getProgressCourse(userId: string): Promise<mysql.RowDataPacket[]> {
    const [rows] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT cm.*,c.name FROM CourseManagement cm JOIN Course c on c.courseId = cm.courseId WHERE studentId=? `, [userId]
    )
    return rows
  }
  async patchRate(courseId: string, rate: number) {
    const [rows1] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM Course WHERE courseId=?`, [courseId]
    )
    const course = rows1[0]
    const newRate = (course.rate + rate) / 2
    await this.db.execute(
      'UPDATE Course SET rate=? WHERE courseId=?', [newRate, courseId]
    )
  }
  async getProgressLesson(courseId: string, studentId: string): Promise<mysql.RowDataPacket[]> {
    try {
      const [rows] = await this.db.execute<mysql.RowDataPacket[]>(
        `SELECT * FROM StudentVideoProgress WHERE courseId=? AND studentId=?`, [courseId, studentId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
    }
  }
  async SyncProgress(videoId: string, currentTime: number, isCompleted: boolean, studentId: string) {
    try {
      await this.db.execute(
        `UPDATE StudentVideoProgress SET lastPosition=?, isCompleted=? WHERE videoId=? AND studentId=?`, [currentTime, isCompleted, videoId, studentId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
    }
  }
  async patchCourseProgress(courseId: string, studentId: string) {
    const lessonProgress = await this.getProgressLesson(courseId, studentId)
    const lessonProgress2 = lessonProgress.filter((t) => t.isCompleted === 1)
    const progress = Math.ceil((lessonProgress2.length / lessonProgress.length) * 100)
    if (progress == 100) {
      await this.db.execute(
        `UPDATE CourseManagement SET progress=100,status='completed' WHERE courseId=? AND studentId=?`, [courseId, studentId]
      )
    }
    else {
      await this.db.execute(
        `UPDATE CourseManagement SET progress=? WHERE courseId=? AND studentId=?`, [progress, courseId, studentId]
      )
    }
  }
  async getMultipleCourseById(studentId: string): Promise<mysql.RowDataPacket[]> {
    const [rows1] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT mc.* FROM MultipleCourse mc JOIN CourseManagement cm on cm.multipleCourseId = mc.multipleCourseId WHERE studentId=? AND mc.multipleCourseId is not null AND mc.courseId is null`, [studentId]
    )
    for (let i = 0; i < rows1.length; i++) {
      const [courses] = await this.db.execute<mysql.RowDataPacket[]>(
        `SELTEC c.courseId, c.name, cm.progress FROM Course c JOIN CourseManagement cm on cm.courseId = c.courseId WHERE c.multipleCourseId=? AND cm.isMultiple=1`, [rows1[i].multipleCourseId]
      )
      rows1[i].courses = courses
    }
    return rows1
  }
  async postPayment(courseId: string, studentId: string): Promise<string> {
    try {
      const course = await this.getDetailCourse(courseId)
      const paymentId = randomUUID()
      const day = new Date()
      const url = `https://img.vietqr.io/image/mbbank-0334477715-print.png?amount=${course.cost}&addInfo=${paymentId}&accountName=Code%20Your%20Self`
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data, 'binary')
        const fileName = `qr-${paymentId}-${Date.now()}.png`
        await this.minioClinent.putObject(
          this.bucketName,
          fileName,
          buffer,
          buffer.length,
          { 'Content-Type': 'image/png' }
        )
        const minioUrl = `http://localhost:9000/${this.bucketName}/${fileName}`
        await this.db.query(
          `INSERT INTO Payment (paymentId, createdAt, amount, courseId, studentId, qrUrl, status, deleted, periodMonth, periodYear) VALUES (?,?,?,?,?,?,?,?,?,?)`, [paymentId, day, course.cost, courseId,studentId,minioUrl,'PENDING',0,day.getMonth() + 1,day.getFullYear()]
        )
        return paymentId
      } catch (error) {
        console.error(error)
        throw new InternalServerErrorException('loi')
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
    }
  }
  async getPayment (paymentId : string) : Promise<mysql.RowDataPacket>{
    const [rows] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM Payment WHERE paymentId=?`,[paymentId]
    )
    return rows[0]
  }
  async postCourseManagementSingle (studentId: string, courseId: string, status: string){
    try {
      await this.db.query(
        `INSERT INTO CourseManagement (studentId, courseId, status) VALUES (?,?,?)`,[studentId,courseId,status] 
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
    }
  }
  async postStudentVideoProgress(studentId, videoId, courseId ){
    try {
      await this.db.query(
        `INSERT INTO StudentVideoProgress (studentId, videoId, courseId) VALUES (?,?,?)`,[studentId,videoId,courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
    }
  }
}