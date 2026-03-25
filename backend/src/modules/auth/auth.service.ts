import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
interface AccountRow extends mysql.RowDataPacket{
  username: string, 
  password: string,
  userId: string, 
  userrole: string, 
  deleted: string
}
interface SessionRow extends mysql.RowDataPacket{
  sessionid: string, 
  userId: string, 
  refreshtoken: string, 
  expireat: Date,
  createat: Date
}
@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool ,
  ) { }
  async getAccount (username: string,role: string) : Promise<AccountRow>{
    const [rows] = await this.db.execute<AccountRow[]>('SELECT * FROM Account WHERE username=? AND userrole=? ',[username,role])
    return rows[0] 
  }
  async postSession(userid: string, refreshtoken : string, createat : Date, expireat : Date) : Promise<void>{
    try {
      console.log('Dữ liệu session:', { userid, refreshtoken, createat,expireat });
      await this.db.execute('INSERT INTO Session (userid, refreshtoken, createat, expireat) VALUES (?,?,?,?)',[userid,refreshtoken,createat,expireat] )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  async checkAccount (username: string) : Promise<AccountRow>{
    const [rows] = await this.db.execute<AccountRow[]>('SELECT * FROM Account WHERE username=?',[username])
    return rows[0]
  }
  async postAccount(username: string, password: string,role: string) :Promise<void>{
    try {
      
      await this.db.execute('INSERT INTO Account (username, password, userrole) VALUES (?,?,?)',[username,password,role])
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống!')
    }
  }
  async postTeacher (userid: string, name: string, dob: Date,address: string, gender: string, createat: Date) : Promise<void>{
    try {
      await this.db.execute('INSERT INTO Teacher (userId,name, dob,address,gender,createdAt) VALUES (?,?,?,?,?,?)',[userid,name,dob,address,gender,createat])
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống!')
    }
  }
  async postStudent (userid: string, name: string, dob : Date,address: string, gender: string) : Promise<void>{
    try {
      await this.db.execute('INSERT INTO Student (userId,name, dob,address,gender) VALUES (?,?,?,?,?)',[userid,name, dob,address,gender])
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống!')
    }
  }
  async getSession (refreshtoken: string) : Promise<SessionRow>{
    try {
      const [rows] = await this.db.execute<SessionRow[]>('SELECT * FROM Session WHERE refreshtoken=?',[refreshtoken])
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống!')
    }
  }
  async getAccountById (userid : string): Promise<AccountRow>{
    try {
      const [rows] = await this.db.execute<AccountRow[]>('SELECT * FROM Account WHERE userid=? AND deleted=0',[userid])
      return rows[0]
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống!')
    }
  }
  async deleteSession (refreshtoken : string): Promise<void>{
    try {
      await this.db.execute('DELETE FROM Session WHERE refreshtoken=?',[refreshtoken])
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống!')
    }
  }
}
