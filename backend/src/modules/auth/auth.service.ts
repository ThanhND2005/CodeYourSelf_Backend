import { Inject, Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
interface AccountRow extends mysql.RowDataPacket{
  username: string, 
  password: string,
}
@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool ,
  ) { }
  async getAccount (username: string) : Promise<AccountRow>{
    const [rows] = await this.db.execute<AccountRow[]>('SELECT * FROM Account WHERE username=?',[username])
    return rows[0] 
  }
  async postAccount (username : string, password: string, userrole) {
    const [result] = await this.db.execute(`INSERT INTO Account (username, password, userrole) VALUES (?,?,?)`,[username,password,userrole])
    return result
  }
  async postStudent (name: string, address: string, dob: Date, gender: string){
    const [result] = await this.db.execute(`INSERT INTO Student (name, address,dob, gender) VALUES (?,?,?,?)`,[name,address,dob,gender])
    return result
  }
  async postTeacher (name: string, address: string, dob: Date, gender: string){
    const [result] = await this.db.execute(`INSERT INTO Teacher (name, address,dob, gender) VALUES (?,?,?,?)`,[name,address,dob,gender])
    return result
  }
  
}
