import { Inject, Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise'

interface StudentRow extends mysql.RowDataPacket {
  userId: string,
  name: string,
  dob: Date,
  address: string,
  phone: string,
  gender: string,

}
interface TeacherRow extends mysql.RowDataPacket {
  userId: string,
  name: string,
  dob: Date,
  address: string,
  phone: string,
  gender: string,
  createAt: Date,
}
interface NotificationRow extends mysql.RowDataPacket {
  senderId: string,
  receiverId: string,
  notificationId: string,
  title: string,
  content: string,
  createdAt: Date
}
interface WaitCourseRow extends mysql.RowDataPacket{
  courseId: string, 
  name: string, 
  cost: string, 
  summary: string, 
  teacherId: string,
  teacherName: string,
}
@Injectable()
export class AdminService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool,
  ) { }
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
    const [rows] = await this.db.execute<TeacherRow[]>(`SELECT userId, name,dob,address, phone, gender, createAt FROM Teacher WHERE deleted=0`)
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
    const [rows] = await this.db.execute<WaitCourseRow[]>(`SELECT c.courseId, c.name, c.cost,c.summary,c.teacherId, t.name as teacherName FROM Course c JOIN Teacher t on t.userId= c.teacherId WHERE deleted=1`)
    return rows
  } 
}
