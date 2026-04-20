import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise'
import * as Minio from 'minio'
import { Course, CourseVideo, MultipleCourse, Student } from './dto/create-student.dto';

@Injectable()
export class StudentService {
  private readonly minioClinent: Minio.Client
  private readonly bucketName = 'images'
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool,
  ) {
    this.minioClinent = new Minio.Client({
      endPoint:'localhost',
      port: 9000,
      useSSL:false,
      accessKey: 'admin',
      secretKey:'admin12345'
    })
  }
  async searchCourse (searchTerm : string) : Promise<Course[]>{
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await this.db.execute<Course[]>(
        `SELECT c.courseId, c.name, c.imageUrl, c.cost,c.rate,t.name as teacherName
          FROM Course c
          JOIN Teacher t on t.userId = c.teacherId
          WHERE c.name LIKE ? OR c.summary LIKE ?`,[searchPattern,searchPattern]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async searchMultipleCourse (searchTerm : string) : Promise<MultipleCourse[]>{
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await this.db.execute<MultipleCourse[]>(
        `SELECT c.multipleCourseId, c.name, c.imageUrl, c.cost,c.rate,c.imageUrl,t.name as teacherName
          FROM MultipleCourse c
          JOIN Teacher t on t.userId = c.teacherId
          WHERE c.name LIKE ? OR c.sumary LIKE ?`,[searchPattern,searchPattern]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getDetailCourse (courseId: string) : Promise<Course>{
    try {
      const [rows] = await this.db.execute<Course[]>(
        `SELECT c.*, t.name as teacherName FROM Course c JOIN Teacher t on t.userId = c.teacherId WHERE c.deleted=0 AND c.courseId=?`,[courseId]
      )
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getDetailCourseById (courseId: string) : Promise<Course[]>{
    try {
      const [rows] = await this.db.execute<Course[]>(
        `SELECT c.*,t.name as teacherName FROM Course c JOIN Teacher t on t.userId = c.teacherId WHERE c.deleted=0 AND c.multipleCourseId=?`,[courseId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getDetailMultipleCourse (multipleCourseId: string) : Promise<MultipleCourse>{
    try {
      const [rows] = await this.db.execute<MultipleCourse[]>(
        `SELECT * FROM MultipleCourse WHERE deleted=0 AND multipleCourseId=?`,[multipleCourseId]
      )
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getCoursePaid (courseId: string): Promise<CourseVideo[]>{
    try {
      const [rows] = await this.db.execute<CourseVideo[]>(
        `SELECT * FROM CourseVideo WHERE deleted=0 AND courseId = ?`,[courseId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async reviewCourse (courseScore: number,courseId: string) : Promise<void>{
    try {
      await this.db.execute(
        'UPDATE Course SET rate=? WHERE courseId=?',[courseScore,courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async postComment (courseId: string, userId:string,content: string, createdAt: Date) : Promise<void> {
    try {
      await this.db.execute(
        'INSERT INTO Comment (userId, courseId, content, createdAt) VALUES (?,?,?,?)',[userId,courseId,content,createdAt]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getInformation(userId: string) : Promise<Student>{
    try {
      const [rows] = await this.db.execute<Student[]>(
        'SELECT * FROM Student WHERE userId=? AND deleted=0',[userId]
      )
      return rows[0]  
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async patchInformation(userId:string,name: string, dob: Date,address: string,phone: string,gender:string): Promise<void>{
    try {
      await this.db.execute(
        'UPDATE Student SET name=?,dob=?,address=?,phone=?,gender=? WHERE userId=?',[name, dob,address,phone,gender,userId]
      )
    } catch (error) {
        console.error(error)
        throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async uploadImages(file : Express.Multer.File, userId: string) : Promise<string>{
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
        'UPDATE Student SET avatarUrl=? WHERE userId=?',[avatarUrl,userId]
      )
      return avatarUrl
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
}
