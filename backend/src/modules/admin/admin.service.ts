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
  avatarUrl: string,
  bankName : string, 
  bankAccount: string
}
export interface NotificationRow extends mysql.RowDataPacket {
  senderId: string,
  receiverId: string,
  receiverRole: string,
  notificationId: string,
  title: string,
  content: string,
  createdAt: Date
}
export interface WaitCourseRow extends mysql.RowDataPacket {
  courseId: string,
  name: string,
  cost: string,
  summary: string,
  teacherId: string,
  teacherName: string,
  imageUrl: string,
}
export interface StudentBill extends mysql.RowDataPacket {
  paymentId: string,
  createdAt: Date,
  amount: number,
  courseId: string,
  courseName: string,
  studentId: string,
  studentName: string,
  qrUrl: string,
  status: string,
  periodMonth: number,
  periodYear: number
}
export interface TeacherBill extends mysql.RowDataPacket {
  salaryId: string,
  createdAt: Date,
  amount: number,
  teacherId: string,
  teacherName: string,
  status: string,
  qrUrl: string,
  periodMonth: number,
  periodYear: number
}
export interface DashboardNotificationDTO extends mysql.RowDataPacket {
  id: string;
  message: string;
  createdAt: string;
  senderAvatarUrl: string;
}

@Injectable()
export class AdminService {
  private readonly minioClient: Minio.Client
  private readonly bucketName = 'images'
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'admin',
      secretKey: 'admin12345'
    })
  }
  async getNotificationReceived(): Promise<DashboardNotificationDTO[]> {
    try {
      
      const [rows1] = await this.db.execute<DashboardNotificationDTO[]>(
        `SELECT n.notificationId as id,n.content as message, n.createdAt, s.avatarUrl as senderAvatarUrl FROM Notification n JOIN NotificationManagement nm on nm.notificationId = n.notificationId JOIN Teacher s on s.userId = nm.senderId WHERE nm.receiverRole='admin'`, []
      )
      return rows1
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async getStudents(): Promise<mysql.RowDataPacket[]> {
    const [rows] = await this.db.execute<mysql.RowDataPacket[]>(`SELECT s.* FROM Student s JOIN Account a on a.userId = s.userId AND a.deleted = 0 WHERE s.deleted = 0`, [])
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
    const [rows] = await this.db.execute<TeacherRow[]>(`SELECT userId, name,dob,address, phone, gender, createdAt,avatarUrl,bankName,bankAccount FROM Teacher WHERE deleted=0`)
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
        m.receiverRole,
        
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
    createdAt,
    receiverRole
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
  async getWaitCourses(): Promise<WaitCourseRow[]> {
    const [rows] = await this.db.execute<WaitCourseRow[]>(`SELECT c.courseId, c.name, c.cost,c.summary,c.teacherId, t.name as teacherName,c.imageUrl,c.status FROM Course c JOIN Teacher t on t.userId= c.teacherId WHERE c.deleted=0`)
    return rows
  }
  async getWaitMultipleCourses(): Promise<WaitCourseRow[]> {
    const [rows] = await this.db.execute<WaitCourseRow[]>(`SELECT c.multipleCourseId as courseId, c.name, c.cost,c.sumary as summary,c.teacherId, t.name as teacherName,c.imageUrl,c.status FROM MultipleCourse c JOIN Teacher t on t.userId= c.teacherId WHERE c.deleted=0`)
    return rows
  }
  async getStudentBills(): Promise<StudentBill[]> {
    const [rows] = await this.db.execute<StudentBill[]>(
      `SELECT p.paymentId, p.createdAt,p.amount, p.courseId, c.name as courseName, p.studentId, s.name as studentName, p.qrUrl,p.status,p.periodMonth, p.periodYear 
      FROM Payment p 
      JOIN Course c on c.courseId = p.courseId 
      JOIN Student s on s.userId = p.studentId 
      WHERE p.deleted=0`
    )
    return rows
  }
  async postStudentBill(paymentId: string, createdAt: Date, amount: number, courseId: string, studentId: string): Promise<StudentBill> {
    const url = `https://img.vietqr.io/image/mbbank-0334477715-print.png?amount=${amount}&addInfo=${paymentId}&accountName=Code%20Your%20Self`
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data, 'binary')
      const fileName = `qr-${paymentId}-${Date.now()}.png`;
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        buffer,
        buffer.length,
        { 'Content-Type': 'image/png' }
      )
      const minioUrl = `http://localhost:9000/${this.bucketName}/${fileName}`
      await this.db.execute(
        `INSERT INTO Payment (paymentId, createdAt, amount, courseId, studentId,qrUrl) VALUES (?,?,?,?,?,?)`, [paymentId, createdAt, amount, courseId, studentId, minioUrl]
      )
      const [rows] = await this.db.execute<StudentBill[]>(
        `SELECT p.paymentId, p.createdAt,p.amount, p.courseId, c.name as courseName, p.studentId, s.name as studentName, p.qrUrl,p.status 
        FROM Payment p 
        JOIN Course c on c.courseId = p.courseId AND c.deleted=0
        JOIN Student s on s.userId = p.studentId AND s.deleted=0
        WHERE p.deleted=0 AND p.paymentId=?`, [paymentId]
      )
      return rows[0]

    } catch (error) {
      console.error('Lỗi khi xử lý ảnh QR trên server:', error);
      throw new InternalServerErrorException('Lỗi server khi tạo và lưu QR Code');
    }
  }
  async postSalary(salaryId: string, createdAt: Date, amount: number, teacherId: string, periodMonth: number, periodYear: number,accountName: string, accountNumber : string): Promise<void> {
    const url = `https://img.vietqr.io/image/${accountName}-${accountNumber}-print.png?amount=${amount}&addInfo=${salaryId}&accountName=Code%20Your%20Self`;
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" })
      const buffer = Buffer.from(response.data, 'binary')
      const fileName = `qr-${salaryId}-${Date.now()}.png`;
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        buffer,
        buffer.length,
        { 'Content-Type': 'image/png' }
      )
      const minioUrl = `http://localhost:9000/${this.bucketName}/${fileName}`
      
      await this.db.query(
        `INSERT IGNORE INTO Salary (salaryId, createdAt, amount, teacherId, qrUrl, status, periodMonth, periodYear) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`, [salaryId, createdAt, amount, teacherId, minioUrl, periodMonth, periodYear, teacherId, periodMonth, periodYear]
      )
    } catch (error) {
      console.error('Lỗi khi xử lý ảnh QR trên server:', error);
      throw new InternalServerErrorException('Lỗi server khi tạo và lưu QR Code');
    }
  }
  async getSalary(): Promise<TeacherBill[]> {
    const [rows] = await this.db.execute<TeacherBill[]>(
      `SELECT s.salaryId, s.createdAt,s.amount, s.teacherId,t.name as teacherName,s.status,s.qrUrl,s.periodMonth, s.periodYear
      FROM Salary s 
      JOIN Teacher t on t.userId=s.teacherId
      WHERE s.deleted = 0`
    )
    return rows
  }
  async getTeacherBill(salaryId: string) : Promise<TeacherBill>{
    const [rows] = await this.db.execute<TeacherBill[]>(
      `SELECT s.salaryId, s.createdAt,s.amount, s.teacherId,t.name as teacherName,s.status,s.qrUrl,s.periodMonth, s.periodYear
      FROM Salary s 
      JOIN Teacher t on t.userId=s.teacherId
      WHERE s.deleted = 0 AND s.salaryId=?`,[salaryId]
    )
    return rows[0]
  }
  async deleteStudentBill(paymentId: string): Promise<void> {
    await this.db.execute(
      `UPDATE Payment SET deleted=1 WHERE paymentId=?`, [paymentId]
    )
  }
  async acceptWaitCourse(courseId: string): Promise<void> {
    await this.db.execute(
      `UPDATE Course SET deleted=0, status='Đã duyệt' WHERE courseId=?`, [courseId]
    )
  }
  async acceptWaitMultipleCourse(courseId: string): Promise<void> {
    await this.db.execute(
      `UPDATE MultipleCourse SET deleted=0, status='Đã duyệt' WHERE multipleCourseId=?`, [courseId]
    )
  }
  async denyWaitCourse(courseId: string): Promise<void> {
    await this.db.execute(
      `UPDATE Course SET deleted=1 WHERE courseId=?`, [courseId]
    )
  }
  async denyWaitMultipleCourse(courseId: string): Promise<void> {
    await this.db.execute(
      `UPDATE MultipleCourse SET deleted=1 WHERE multipleCourseId=?`, [courseId]
    )
  }
  async getCourseById(teacherId: string): Promise<StudentBill[]> {
    const month = (new Date()).getMonth()
    const [rows] = await this.db.execute<StudentBill[]>(
      `SELECT p.paymentId, p.createdAt,p.amount, p.courseId, c.name as courseName, p.studentId, s.name as studentName, p.qrUrl,p.status 
      FROM Payment p 
      JOIN Course c on c.courseId = p.courseId AND c.deleted=0
      JOIN Student s on s.userId = p.studentId AND s.deleted=0
      JOIN Teacher t on t.userId = c.teacherId AND t.deleted=0
      WHERE p.deleted=0 AND t.userId=?`, [teacherId]
    )
    return rows.filter((t) => (new Date(t.createdAt)).getMonth() === month)
  }
  async getCourses(): Promise<mysql.RowDataPacket[]> {
    try {
      const [rows] = await this.db.execute<mysql.RowDataPacket[]>(
        `SELECT * FROM Course WHERE status='Đã duyệt' AND deleted=0`
      )
      return rows
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
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
      
      await connection.beginTransaction();

      
      await connection.execute(
        `INSERT INTO Notification (notificationId, title, content, createdAt, deleted) 
       VALUES (?, ?, ?, NOW(), 0)`,
        [notificationId, title, content]
      );

      
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
      await connection.commit();

    } catch (error) {
      await connection.rollback();
      console.error('Lỗi khi tạo thông báo:', error);
      throw error;

    } finally {
      if (connection && connection.release) {
        connection.release();
      }
    }
  }
  async patchTeacher(teacherId: string, name: string, dob: Date, address: string, phone: string, gender: string) {
    try {
      await this.db.execute(
        `UPDATE Teacher SET name=?,dob=?,address=?,phone=?,gender=? WHERE userId=?`, [name, dob, address, phone, gender, teacherId]
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('loi')
    }
  }
}
