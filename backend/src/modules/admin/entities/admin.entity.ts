import * as mysql from 'mysql2/promise'
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
  createAt: Date,
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