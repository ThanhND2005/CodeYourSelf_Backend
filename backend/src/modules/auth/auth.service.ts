import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
interface AccountRow extends mysql.RowDataPacket{
  username: string, 
  password: string,
  userid: string, 
  userrole: string, 
  deleted: string
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
      
      await this.db.execute('INSERT INTO Session (userid, refreshtoken, createat, expireat) VALUES (?,?,?,?)',[userid,refreshtoken,createat,expireat] )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  
}
