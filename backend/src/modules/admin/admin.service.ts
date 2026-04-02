import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise'
import * as Minio from 'minio'
import axios from 'axios'
export interface StudentRow extends mysql.RowDataPacket {
  userId: string,
  name: string,
  dob: Date,
  address: string,
  phone: string,
  gender: string,

}
export interface TeacherRow extends mysql.RowDataPacket {
  userId: string,
  name: string,
  dob: Date,
  address: string,
  phone: string,
  gender: string,
  createdAt: Date,
}
export interface NotificationRow extends mysql.RowDataPacket {
  senderId: string,
  receiverId: string,
  notificationId: string,
  title: string,
  content: string,
  createdAt: Date
}
export interface WaitCourseRow extends mysql.RowDataPacket{
  courseId: string, 
  name: string, 
  cost: string, 
  summary: string, 
  teacherId: string,
  teacherName: string,
}
export interface StudentBill extends mysql.RowDataPacket{
  paymentId: string, 
  createdAt: Date,
  amount: number,
  courseId: string,
  courseName: string,
  studentId: string,
  studentName: string,
  qrUrl: string,
  status: string,
}
export interface TeacherBill extends mysql.RowDataPacket{
  salaryId: string,
  createdAt: Date,
  amount: number,
  teacherId: string,
  teacherName: string,
  status:string,
  qrUrl: string
}

@Injectable()
export class AdminService {
  private readonly minioClient : Minio.Client
  private readonly bucketName = 'images'
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool,
  ) {
    this.minioClient = new Minio.Client({
      endPoint:'localhost',
      port:9000,
      useSSL:false,
      accessKey:'admin',
      secretKey:'admin1234'
    })
   }
  async getStudents(): Promise<StudentRow[]> {
    const [rows] = await this.db.execute<StudentRow[]>(`SELECT s.* FROM Student s JOIN Account a on a.userId = s.userId AND a.deleted = 0 WHERE s.deleted = 0`, [])
    return rows
  }
  async deleteStudent(userId: string): Promise<void> {
    const connection: mysql.PoolConnection = await this.db.getConnection()
    try {
      await connection.beginTransaction()

      await connection.execute(`UPDATE Student SET deleted=1 WHERE userId=?`, [userId])
      await connection.execute(`UPDATE Account SET deleted=1 WHERE userId=?`, [userId])
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }
  }
  async getTeachers(): Promise<TeacherRow[]> {
    const [rows] = await this.db.execute<TeacherRow[]>(`SELECT userId, name,dob,address, phone, gender, createdAt FROM Teacher WHERE deleted=0`)
    return rows
  }
  async deleteTeacher(userId: string): Promise<void> {
    const connection: mysql.PoolConnection = await this.db.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute(`UPDATE Teacher SET deleted=1 WHERE userId=?`, [userId])
      await connection.execute(`UPDATE Account SET deleted=1 WHERE userId=?`, [userId])
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
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
  async deleteNotification(notificationId: string): Promise<void> {
    const connection: mysql.PoolConnection = await this.db.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute(`UPDATE NotificationManagement SET deleted=1 WHERE notificationId=?`, [notificationId])
      await connection.execute(`UPDATE Notification SET deleted=1 WHERE notificationId =?`, [notificationId])
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    }
    finally {
      connection.release()
    }
  }
  async getWaitCourses (): Promise<WaitCourseRow[]>{
    const [rows] = await this.db.execute<WaitCourseRow[]>(`SELECT c.courseId, c.name, c.cost,c.summary,c.teacherId, t.name as teacherName FROM Course c JOIN Teacher t on t.userId= c.teacherId WHERE c.deleted=1`)
    return rows
  } 
  async getStudentBills (): Promise<StudentBill[]> {
    const [rows] =await this.db.execute<StudentBill[]>(
      `SELECT p.paymentId, p.createdAt,p.amount, p.courseId, c.name as courseName, p.studentId, s.name as studentName, p.qrUrl,p.status 
      FROM Payment p 
      JOIN Course c on c.courseId = p.courseId 
      JOIN Student s on s.userId = p.studentId 
      WHERE p.deleted=0`
    )
    return rows
  }
  async postStudentBill (paymentId: string, createdAt: Date,amount: number,courseId: string,studentId:string): Promise<StudentBill>{
    const url = `https://img.vietqr.io/image/mbbank-0334477715-print.png?amount=${amount}&addInfo=${paymentId}&accountName=Code%20Your%20Self`
    try {
      const response = await axios.get(url,{responseType:'arraybuffer'})
      const buffer = Buffer.from(response.data,'binary')
      const fileName= `qr-${paymentId}-${Date.now()}.png`;
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        buffer,
        buffer.length,
        {'Content-Type' :'image/png'}
      )
      const minioUrl = `http://localhost:9000/${this.bucketName}/${fileName}`
      await this.db.execute(
        `INSERT INTO Payment (paymentId, createdAt, amount, courseId, studentId,qrUrl) VALUES (?,?,?,?,?,?)`,[paymentId,createdAt,amount,courseId,studentId,minioUrl]
      )
      const [rows] = await this.db.execute<StudentBill[]>(
        `SELECT p.paymentId, p.createdAt,p.amount, p.courseId, c.name as courseName, p.studentId, s.name as studentName, p.qrUrl,p.status 
        FROM Payment p 
        JOIN Course c on c.courseId = p.courseId AND c.deleted=0
        JOIN Student s on s.userId = p.studentId AND s.deleted=0
        WHERE p.deleted=0 AND p.paymentId=?`,[paymentId]
      )
      return rows[0]
      
    } catch (error) {
      console.error('Lỗi khi xử lý ảnh QR trên server:', error);
      throw new InternalServerErrorException('Lỗi server khi tạo và lưu QR Code');
    }
  }
  async postSalary (salaryId: string, createdAt:Date, amount: number,teacherId: string): Promise<void>{
    const url =`https://img.vietqr.io/image/mbbank-0334477715-print.png?amount=${amount}&addInfo=${salaryId}&accountName=Code%20Your%20Self`;
    try {
      const response =await axios.get(url,{responseType:"arraybuffer"})
      const buffer = Buffer.from(response.data,'binary')
      const fileName= `qr-${salaryId}-${Date.now()}.png`;
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        buffer,
        buffer.length,
        {'Content-Type' :'image/png'}
      )
      const minioUrl = `http://localhost:9000/${this.bucketName}/${fileName}`
      await  this.db.execute(
        `INSERT INTO Salary (salaryId ,createdAt, amount,teacherId, qrUrl) VALUES (?,?,?,?,?)`,[salaryId,createdAt,amount,teacherId,minioUrl]
      )
    } catch (error) {
      console.error('Lỗi khi xử lý ảnh QR trên server:', error);
      throw new InternalServerErrorException('Lỗi server khi tạo và lưu QR Code');
    }
  }
  async getSalary () : Promise<TeacherBill[]> {
    const [rows] = await this.db.execute<TeacherBill[]>(
      `SELECT s.salaryId, s.createdAt,s.amount, s.teacherId,t.name as teacherName,s.status,s.qrUrl 
      FROM Salary s 
      JOIN Teacher t on t.userId=s.teacherId
      WHERE s.deleted = 0`
    )
    return rows
  }
  async deleteStudentBill (paymentId  : string) : Promise<void>{
    await this.db.execute(
      `UPDATE Payment SET deleted=1 WHERE paymentId=?`,[paymentId]
    )
  }
  async acceptWaitCourse (courseId: string): Promise<void>{
    await this.db.execute(
      `UPDATE Course SET deleted=0 WHERE courseId=?`,[courseId]
    )
  }
  async denyWaitCourse (courseId: string) : Promise<void>{
    await this.db.execute(
      `DELETE FROM Course WHERE courseId=?`,[courseId]
    )
  }
  async getCourseById(teacherId: string): Promise<StudentBill[]>{
    const month = (new Date()).getMonth()
    const [rows] = await this.db.execute<StudentBill[]>(
      `SELECT p.paymentId, p.createdAt,p.amount, p.courseId, c.name as courseName, p.studentId, s.name as studentName, p.qrUrl,p.status 
      FROM Payment p 
      JOIN Course c on c.courseId = p.courseId AND c.deleted=0
      JOIN Student s on s.userId = p.studentId AND s.deleted=0
      JOIN Teacher t on t.userId = c.teacherId AND t.deleted=0
      WHERE p.deleted=0 AND t.userId=?`,[teacherId]
    )
    return rows.filter((t)=> (new Date(t.createdAt)).getMonth() === month)
  }
}
