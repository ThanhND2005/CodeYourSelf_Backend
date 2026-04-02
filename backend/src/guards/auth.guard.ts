import {Injectable,CanActivate,ExecutionContext,UnauthorizedException} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import { AuthRequest, Decoded } from './auth.interface'


@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean  {
        const request = context.switchToHttp().getRequest<AuthRequest>()
        const authHeader = request.headers['authorization']
        const token = authHeader && authHeader.split(" ")[1]
        if(!token)
        {
            throw new UnauthorizedException('Không tìm thấy token')
        }
        try {
            const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET as string) as Decoded
            request.user = {
                userId : decoded.userId,
                role: decoded.role
            }
            
            return true
        } catch (error) {
            console.error(error)
            throw new UnauthorizedException('Token đã hết hạn hoặc không hợp lệ')
        }
    }
}