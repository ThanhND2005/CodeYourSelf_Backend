import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, HttpCode, HttpStatus, InternalServerErrorException, ConflictException, Res, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/create-auth.dto';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto';
import type { Response,Request } from 'express';
interface User extends Request{
  user:{
    userid: string, 
  role: string}
}
@Controller('apis/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signinAdmin')
  @HttpCode(HttpStatus.OK)
  async signinAdmin(@Body() {username, password} : LoginDto,@Res({passthrough: true}) res: Response){
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
      const accessToken = jwt.sign({userid: account.userId, role : account.userrole}, process.env.ACCESS_TOKEN_SECRET as string,{expiresIn:'30m'})
      const refreshToken = randomUUID()
      const expireat = new Date()
      expireat.setTime(expireat.getTime() + (8*60*60*1000))
      await this.authService.postSession(account.userid,refreshToken, new Date(),expireat)
      res.cookie('refreshtoken',refreshToken,{
        httpOnly: true,
        secure:true,
        sameSite: 'none',
        maxAge: 8*60*60*1000
      })
      return {accessToken, message:'Đăng nhập thành công !'}
      
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  @Post('signinTeacher')
  @HttpCode(HttpStatus.OK)
  async signinTeacher (@Body() {username, password} : LoginDto,@Res({passthrough: true}) res : Response){
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
      const accessToken = jwt.sign({userid: account.userId, role:account.userrole},process.env.ACCESS_TOKEN_SECRET as string,{expiresIn:'30m'})
      const refreshToken = randomUUID()
      const expireat = new Date() 
      expireat.setTime(expireat.getTime() + (8*60*60*1000))
      await this.authService.postSession(account.userid,refreshToken,new Date(),expireat)
      res.cookie('refreshtoken',refreshToken,{
        httpOnly: true,
        secure:true,
        sameSite: 'none',
        maxAge: 8*60*60*1000
      })
      return {accessToken, message:'Đăng nhập thành công !'}
      
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống !')
    }
  }
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async singin (@Body() {username, password} : LoginDto, @Res({passthrough: true}) res: Response){
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
      const accessToken = jwt.sign({userid: account.userId,role: account.userrole},process.env.ACCESS_TOKEN_SECRET as string, {expiresIn:'30m'})
      const refreshtoken = randomUUID()
      const expireat = new Date()
      expireat.setTime(expireat.getTime() + (8*60*60*1000))
      await this.authService.postSession(account.userid,refreshtoken,new Date(),expireat)
      res.cookie('refreshtoken',refreshtoken,{
        httpOnly: true,
        secure:true,
        sameSite: 'none',
        maxAge: 8*60*60*1000
      })
      return {accessToken, message:'Đăng nhập thành công !'}
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống !')
    }
  }
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() {name, address, dob,gender,username,password, role} : SignupDto){
    try {
      console.log(username)
      const account = await this.authService.checkAccount(username)
      if(account)
      {
        throw new ConflictException('Tài khoản đã tồn tại !')
      }
      const hashPassword = await bcrypt.hash(password,10)
      await this.authService.postAccount(username,hashPassword,role)
      if(role == "teacher")
      {
        const user = await this.authService.getAccount(username,role)
        console.log(user)
        await this.authService.postTeacher(user.userId,name, dob,address,gender,new Date())
      }
      else if(role =="student")
      {
        const user = await this.authService.getAccount(username,role)
        await this.authService.postStudent(user.userid,name, dob,address,gender)
      }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request){
    try {
      const refreshtoken  = (req.cookies?.refreshtoken) as string
      if(!refreshtoken)
      {
        throw new UnauthorizedException('Token không tồn tại')
      }
      const session = await this.authService.getSession(refreshtoken)
      if(!session)
      {
        throw new ForbiddenException('Token không hợp lệ')
      }
      if(session.expireat < new Date())
      {
        throw new ForbiddenException('Token sắp hết hạn')
      }
      const account = await this.authService.getAccountById(session.userid)
      const accessToken = jwt.sign({userid: account.userId,role: account.userrole}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn:'30m'})
      return {accessToken}
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signout(@Res({passthrough: true}) res : Response,@Req() req: Request){
    try {
      const refreshtoken = req.cookies?.refreshtoken as string
      await this.authService.deleteSession(refreshtoken)
      res.clearCookie('refreshtoken')
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Lỗi hệ thống')
    }
  }
  @Get('authMe')
  @HttpCode(HttpStatus.OK)
  authMe(@Res({passthrough: true}) res : Response,@Req() req : User){
    const user = req.user 
    if(!user)
    {
      throw new NotFoundException('Không tìm thấy thông tin người dùng')
    }
    return {user}
  }
}