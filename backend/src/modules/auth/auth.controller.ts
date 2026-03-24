import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, HttpCode, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto';
@Controller('apis/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signinAdmin')
  @HttpCode(HttpStatus.OK)
  async signinAdmin(@Body() {username, password} : LoginDto){
    try {
      const account = await this.authService.getAccount(username,'admin')
      if(!account){
        throw new UnauthorizedException('Thông tin tài khoản và mật khẩu không chính xác !')
      }
      const passwordCorrect = await bcrypt.compare(password,account.password)
      if(!passwordCorrect)
      {
        throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác !')
      }
      const accessToken = jwt.sign({userid: account.userid, role : account.userrole}, process.env.ACCESS_TOKEN_SECRET as string,{expiresIn:'30m'})
      const refreshToken = randomUUID()
      const expireat = new Date()
      expireat.setTime(expireat.getTime() + (8*60*60*1000))
      await this.authService.postSession(account.userid,refreshToken, new Date(),expireat)
      return {accessToken, message:'Đăng nhập thành công !'}
      
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  @Post('signinTeacher')
  @HttpCode(HttpStatus.OK)
  async signinTeacher (@Body() {username, password} : LoginDto){
    try {
      const account = await this.authService.getAccount(username,'teacher')
      if(!account){
        throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác !')
      }
      const correctPassword = await bcrypt.compare(password, account.password)
      if(!correctPassword)
      {
        throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác !')
      }
      const accessToken = jwt.sign({userid: account.userid, role:account.userrole},process.env.ACCESS_TOKEN_SECRET as string,{expiresIn:'30m'})
      const refreshToken = randomUUID()
      const expireat = new Date() 
      expireat.setTime(expireat.getTime() + (8*60*60*1000))
      await this.authService.postSession(account.userid,refreshToken,new Date(),expireat)
      return {accessToken, message:'Đăng nhập thành công !'}
      
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống !')
    }
  }
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async singin (@Body() {username, password} : LoginDto){
    try {
      const account = await this.authService.getAccount(username,'student')
      if(!account) {
        throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác !')
      }
      const correctPassword = await bcrypt.compare(password,account.password)
      if(!correctPassword)
      {
        throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác !')
      }
      const accessToken = jwt.sign({userid: account.userid,role: account.userrole},process.env.ACCESS_TOKEN_SECRET as string, {expiresIn:'30m'})
      const refreshtoken = randomUUID()
      const expireat = new Date()
      expireat.setTime(expireat.getTime() + (8*60*60*1000))
      await this.authService.postSession(account.userid,refreshtoken,new Date(),expireat)
      return {accessToken, message:'Đăng nhập thành công !'}
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống !')
    }
  }
}