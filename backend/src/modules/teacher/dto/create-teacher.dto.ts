import * as mysql from 'mysql2/promise'
export class CreateTeacherDto {}
export interface Teacher extends mysql.RowDataPacket{
    userId: string, 
    name: string, 
    dob: Date,
    address: string,
    phone: string,
    gender: string,
    createdAt: string,
    bankName: string,
    bankAccount: string,
    avatarUrl: string
}
export interface Student extends mysql.RowDataPacket{
    courseId: string, 
    studentId: string, 
    status: string, 
    createdAt : Date,
    progress: number, 
    name: string, 
    avatarUrl: string
    
}
export interface SingleCourse extends mysql.RowDataPacket{
    courseId: string, 
        name: string, 
        cost: number, 
        summary:string, 
        deleted:number, 
        teacherId:string, 
        rate:number, 
        multipleCourseId:string, 
        status:string, 
        imageUrl:string
}
export interface MultipleCourse extends mysql.RowDataPacket{
    multipleCourseId: string, 
        name:string, 
        cost:number, 
        summary: string, 
        deleted:number, 
        rate: number, 
        teacherId: string, 
        imageUrl:string,
        status: string,
}
export interface Video extends mysql.RowDataPacket{
    courseId: string, 
    name: string,
    videoId: string, 
    videoUrl: string, 
}