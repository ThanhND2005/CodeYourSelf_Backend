
import * as mysql from 'mysql2/promise'

export interface Course extends mysql.RowDataPacket {
    courseId: string,
    name: string,
    cost: string,
    summary: string,
    teacherId: string,
    rate: number,
    multipleCourseId: string
}
export interface CourseVideo extends mysql.RowDataPacket{
    courseId: string,
    name: string,
    videoUrl: string,
}
export interface Student extends mysql.RowDataPacket{
    userId: string,
    name: string,
    dob: Date,
    address: string,
    phone: string,
    gender: string
}