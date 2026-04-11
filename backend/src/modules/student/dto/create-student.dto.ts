
import * as mysql from 'mysql2/promise'

export interface Course extends mysql.RowDataPacket {
    courseId: string,
    name: string,
    cost: number,
    imageUrl: string,
    summary: string,
    teacherId: string,
    teacherName: string,
    rate: number,
    multipleCourseId: string,
    lessons: CourseVideo[] | null,
}
export interface MultipleCourse extends mysql.RowDataPacket {
    courseId: string,
    name: string,
    cost: number,
    imageUrl: string,
    summary: string,
    teacherId: string,
    teacherName: string,
    rate: number,
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