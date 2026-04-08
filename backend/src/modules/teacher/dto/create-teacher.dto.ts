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
    bankAccount: string
}
export interface Student extends mysql.RowDataPacket{
    userId : string,
    name: string,
    couseId: string, 
    courseName: string,
    
}