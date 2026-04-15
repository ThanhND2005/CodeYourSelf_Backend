import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateTeacherDto, MultipleCourse, SingleCourse, Student, Teacher } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import * as mysql from 'mysql2/promise'
import * as Minio from 'minio'
import { NotificationRow } from '../admin/admin.service';

@Injectable()
export class TeacherService {
  private readonly minioClient: Minio.Client
  private readonly bucketName = 'images'
  private readonly backetName2 = 'videos'
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: '127.0.0.1',
      port: 9000,
      useSSL: false,
      accessKey: 'admin',
      secretKey: 'admin12345',
      region: 'us-east-1'
    })
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: ['arn:aws:s3:::videos/*'], // Đảm bảo tên bucket đúng là images
        },
      ],
    };

    this.minioClient.setBucketPolicy('videos', JSON.stringify(policy))
      .then(() => console.log('🔥 ĐÃ MỞ KHÓA PUBLIC BUCKET videos THÀNH CÔNG!'))
      .catch((err) => console.error('LỖI MỞ KHÓA:', err));
  }
  async patchInformation(userId: string, name: string, dob: Date, address: string, phone: string, gender: string, bankName: string, bankAccount: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE Teacher SET name=?,dob=?,address=?,phone=?,gender=?,bankName=?,bankAccount=? WHERE userId=?', [name, dob, address, phone, gender, bankName, bankAccount, userId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Loi he thong')
    }
  }
  async getInformation(userId: string): Promise<Teacher> {
    try {
      const [rows] = await this.db.execute<Teacher[]>(
        'SELECT * FROM Teacher WHERE userId=? AND deleted=0', [userId]
      )
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Loi he thong')
    }
  }
  async uploadImages(file: Express.Multer.File, userId: string): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      )
      const avatarUrl = `http://localhost:9000/${this.bucketName}/${fileName}`;
      await this.db.execute(
        'UPDATE Teacher SET avatarUrl=? WHERE userId=?', [avatarUrl, userId]
      )
      return avatarUrl
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async postCourse(name: string, cost: number, summary: string, teacherId: string, rate: number): Promise<void> {
    try {
      await this.db.execute(
        'INSERT INTO Course (name, cost,summary,teacherId,rate) VALUES (?,?,?,?,?)', [name, cost, summary, teacherId, rate]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async addVideo(courseId: string, file: Express.Multer.File, name: string): Promise<void> {
    const fileName = `${Date.now()}-${file.originalname}`
    try {
      await this.minioClient.putObject(
        this.backetName2,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      )
      const videoUrl = `http://localhost:9000/${this.bucketName}/${fileName}`
      await this.db.execute(
        'INSERT INTO CourseVideo (courseId, videoUrl,name) VALUES (?,?,?)', [courseId, videoUrl, name]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE Course SET deleted=1 WHERE courseId=?', [courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async patchCourse(courseId: string, name: string, cost: number, summary: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE Course SET name=?,cost=?,summary=? WHERE courseId=?', [name, cost, summary, courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getStudents(courseId): Promise<Student[]> {
    try {
      const [rows] = await this.db.execute<Student[]>(
        'SELECT s.userId, s.name, c.courseId, c.name as courseName FROM Student s JOIN Payment p on p.studentId = s.userId JOIN Course c on c.courseId = p.courseId WHERE c.deleted=0 AND s.deleted=0 AND p.status IS NOT NULL AND p.courseId = ?', [courseId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getStudentsByTeacher(teacherId): Promise<Student[]> {
    try {
      const [rows] = await this.db.execute<Student[]>(
        'SELECT s.userId, s.name, c.courseId, c.name as courseName FROM Student s JOIN Payment p on p.studentId = s.userId JOIN Course c on c.courseId = p.courseId WHERE c.deleted=0 AND s.deleted=0 AND p.status IS NOT NULL AND c.teacherId = ?', [teacherId]
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getNotifications(userId: string): Promise<NotificationRow[]> {
    const [rows] = await this.db.execute<NotificationRow[]>(
      `WITH RankedNotifications AS (
      SELECT 
          m.senderId, 
          m.receiverId, 
          m.notificationId,
          n.title, 
          n.content,
          n.createdAt,
          
          ROW_NUMBER() OVER(
              PARTITION BY m.notificationId 
              ORDER BY n.createdAt DESC
          ) as rn
      FROM NotificationManagement m
      JOIN Account a ON a.userId = m.senderId 
      JOIN Notification n ON n.notificationId = m.notificationId 
      WHERE a.userId = ? AND m.deleted =0
  )
  
  SELECT 
      senderId, 
      receiverId, 
      notificationId, 
      title, 
      content, 
      createdAt 
  FROM RankedNotifications
  WHERE rn = 1
  ORDER BY createdat DESC;`, [userId]
    )
    return rows
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
  /**
   * Lấy danh sách Single Courses theo teacherId
   */
  async getSingleCoursesByTeacherId(teacherId: string): Promise<SingleCourse[]> {
    // Câu lệnh SQL (bỏ qua các record đã bị xóa mềm deleted = 1)
    const query = `
      SELECT 
        courseId, 
        name, 
        cost, 
        summary, 
        deleted, 
        teacherId, 
        rate, 
        multipleCourseId, 
        status, 
        imageUrl
      FROM Course 
      WHERE teacherId = ? AND deleted = 0
    `;

    try {
      // Sử dụng destructuring để lấy rows
      const [rows] = await this.db.execute<SingleCourse[]>(query, [teacherId]);

      // rows lúc này là mảng các object khớp với interface SingleCourse (chưa tính totalStudents)
      return rows;
    } catch (error) {
      // Xử lý lỗi (log, throw exception...)
      console.error('Error fetching single courses:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách Multiple Courses theo teacherId
   */
  async getMultipleCoursesByTeacherId(teacherId: string): Promise<MultipleCourse[]> {
    const query = `
      SELECT 
        multipleCourseId, 
        name, 
        cost, 
        sumary AS summary, /* Alias cột sumary bị sai chính tả trong DB thành summary giống mock data */
        deleted, 
        rate, 
        teacherId, 
        imageUrl
      FROM MultipleCourse 
      WHERE teacherId = ? AND deleted = 0
    `;

    try {
      const [rows] = await this.db.execute<MultipleCourse[]>(query, [teacherId]);

      return rows;
    } catch (error) {
      console.error('Error fetching multiple courses:', error);
      throw error;
    }
  }
}
