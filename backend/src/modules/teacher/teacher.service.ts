import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateTeacherDto, MultipleCourse, SingleCourse, Student, Teacher, Video } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import * as mysql from 'mysql2/promise'
import * as Minio from 'minio'
import { NotificationRow } from '../admin/admin.service';
import { randomUUID } from 'node:crypto';
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
  async uploadImages2(file: Express.Multer.File, courseId: string): Promise<string> {
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
        'UPDATE Course SET imageUrl=? WHERE courseId=?', [avatarUrl, courseId]
      )
      return avatarUrl
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async uploadImages3(file: Express.Multer.File, courseId: string): Promise<string> {
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
        'UPDATE MultipleCourse SET imageUrl=? WHERE multipleCourseId=?', [avatarUrl, courseId]
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
        `INSERT INTO Course (name, cost,summary,teacherId,rate,status) VALUES (?,?,?,?,?,'Chờ duyệt')`, [name, cost, summary, teacherId, rate]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async postMultipleCourse(name: string, cost: number, summary: string, teacherId: string, rate: number): Promise<void> {
    try {
      await this.db.execute(
        'INSERT INTO MultipleCourse (name, cost,sumary,teacherId,rate) VALUES (?,?,?,?,?)', [name, cost, summary, teacherId, rate]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async addCourse(courseId: string, multipleCourseId: string) : Promise<void>{
    try {
      await this.db.execute(
        `UPDATE Course SET multipleCourseId=? WHERE courseId=?`,[multipleCourseId,courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async removeCourse(courseId: string) : Promise<void>{
    try {
      await this.db.execute(
        `UPDATE Course SET multipleCourseId=NULL WHERE courseId=?`,[courseId]
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
  async getVideo (courseId: string) : Promise<Video[]>{
    try {
     
      const [rows] = await this.db.execute<Video[]>(
        `SELECT * FROM CourseVideo WHERE courseId=?`,[courseId]
      )
      return rows
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
  async deleteCourse2(courseId: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE MultipleCourse SET deleted=1 WHERE multipleCourseId=?', [courseId]
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
  async patchMultipleCourse(courseId: string, name: string, cost: number, summary: string): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE MultipleCourse SET name=?,cost=?,sumary=? WHERE multipleCourseId=?', [name, cost, summary, courseId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('lỗi hệ thống')
    }
  }
  async getStudents(courseId): Promise<Student[]> {
    try {
      const [rows] = await this.db.execute<Student[]>(
        'SELECT cm.*, s.name,s.avatarUrl FROM CourseManagement cm JOIN Student s ON s.userId = cm.studentId WHERE cm.deleted=0 AND s.deleted=0 AND cm.courseId=?', [courseId]
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
  async getNotifications2(userId: string): Promise<NotificationRow[]> {
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
      JOIN Account a ON a.userId = m.receiverId
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
        imageUrl,status
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
  async createNotification(
  title: string,
  content: string,
  senderId: string,
  senderRole: string, 
  receiverIds: string[], 
  receiverRole: string, 
  notificationId: string
): Promise<void> {

  const connection = await this.db.getConnection();
  
  try {
    // Bắt đầu giao dịch
    await connection.beginTransaction();

    // 1. Lưu vào bảng 'Notification' (Chỉ insert 1 lần duy nhất)
    await connection.execute(
      `INSERT INTO Notification (notificationId, title, content, createdAt, deleted) 
       VALUES (?, ?, ?, NOW(), 0)`,
      [notificationId, title, content]
    );

    // 2. Lưu vào bảng 'NotificationManagement' cho từng người nhận
    if (receiverIds && receiverIds.length > 0) {
     
      const insertManagementPromises = receiverIds.map(receiverId => {
        return connection.execute(
          `INSERT INTO NotificationManagement (notificationId, senderId, senderRole, receiverId, receiverRole, deleted) 
           VALUES (?, ?, ?, ?, ?, 0)`,
          [
            notificationId,
            senderId,
            senderRole, 
            receiverId,
            receiverRole
          ]
        );
      });

      await Promise.all(insertManagementPromises);
    }

    // Hoàn tất giao dịch
    await connection.commit();

  } catch (error) {
    // Nếu có bất kỳ lỗi nào, hoàn tác các thay đổi
    await connection.rollback();
    console.error('Lỗi khi tạo thông báo:', error);
    throw error;

  } finally {
    // Rất quan trọng: Giải phóng connection trả lại cho Pool sau khi dùng xong
    if (connection && connection.release) {
      connection.release();
    }
  }
}
  async DeleteNotification(notificationId: string) : Promise<void>{
    try {
      await this.db.execute(
        'UPDATE NotificationManagement SET deleted=1 WHERE notificationId=? ',[notificationId]
      )
    } catch (error) {
      console.error('Error fetching multiple courses:', error);
      throw error;
    }
  }
  async GetMonthIncomeStats(teacherId: string) {
    const [paymentRows] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT 
        p.periodYear,
        p.periodMonth,
        COUNT(p.paymentId) as totalCoursesSold,
        CAST(SUM(p.amount) as UNSIGNED) as totalProfit,
        COUNT(DISTINCT p.studentId) as newStudents
       FROM Payment p
       JOIN Course c ON p.courseId = c.courseId
       WHERE p.deleted = 0 AND p.status = 'SUCCESS' AND c.teacherId=?
       GROUP BY p.periodYear, p.periodMonth
        `,[teacherId]
    )
    const [salaryRows] = await this.db.execute<mysql.RowDataPacket[]>(
      `SELECT 
        periodYear,
        periodMonth,
        CAST(SUM(amount) AS UNSIGNED) as commission
       FROM Salary
       WHERE deleted=0 AND teacherId=?
       GROUP BY periodYear, periodMonth`,[teacherId]
    )
    const [bestCourseRows] = await this.db.execute<mysql.RowDataPacket[]>(
      `WITH CourseSales AS (
        SELECT 
          p.periodYear, 
          p.periodMonth, 
          p.courseId, 
          COUNT(p.paymentId) as salesCount,
          ROW_NUMBER() OVER(PARTITION BY p.periodYear, p.periodMonth ORDER BY COUNT(p.paymentId) DESC) as rn
        FROM Payment p
        JOIN Course c ON p.courseId = c.courseId
        WHERE p.deleted = 0 
          AND p.status = 'SUCCESS' 
          AND c.teacherId = ?
        GROUP BY p.periodYear, p.periodMonth, p.courseId
      )
      SELECT 
        cs.periodYear, 
        cs.periodMonth, 
        cs.salesCount as highestCourseSales,
        c.courseId, c.name, c.cost, c.summary, c.rate, c.status, c.imageUrl
      FROM CourseSales cs
      JOIN Course c ON cs.courseId = c.courseId
      WHERE cs.rn = 1`,[teacherId]
    )
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() +1
    const currentYear = currentDate.getFullYear()

    const stats = paymentRows.map((pRow) =>{
      const year = pRow.periodYear
      const month = pRow.periodMonth 
      const sRow = salaryRows.find((s) => s.periodYear === year && s.periodMonth === month)
      const bcRow = bestCourseRows.find((bc) => bc.periodYear === year && bc.periodMonth === month)
      return {
        id: `stat-${year}-${month}`,
        periodMonth: month,
        periodYear: year,
        isCurrent: year === currentYear && month === currentMonth,
        totalCoursesSold: Number(pRow.totalCoursesSold) || 0,
        totalProfit: Number(pRow.totalProfit) || 0,
        commission: sRow ? Number(sRow.commission) : 0,
        highestCourseSales: bcRow ? Number(bcRow.highestCourseSales) : 0,
        newStudents: Number(pRow.newStudents) || 0,
        bestSellingCourse: bcRow
          ? {
              courseId: bcRow.courseId,
              name: bcRow.name,
              cost: Number(bcRow.cost),
              summary: bcRow.summary,
              rate: bcRow.rate,
              status: bcRow.status,
              imageUrl: bcRow.imageUrl,
            }
          : null,

      }
    })
    return stats.sort((a, b) => {
      if (a.periodYear === b.periodYear) {
        return b.periodMonth - a.periodMonth;
      }
      return b.periodYear - a.periodYear;
    });
  }
  async deleteStudent(courseId: string, studentId: string) {
    await this.db.execute(
      'UPDATE CourseManagement SET deleted=1 WHERE courseId=? AND studentId=?',[courseId,studentId]
    )
  }
}