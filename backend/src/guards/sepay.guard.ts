import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { Request } from "express";
@Injectable()
export class SepayAuthGuard implements CanActivate{
    canActivate(context: ExecutionContext): boolean{
        const request = context.switchToHttp().getRequest<Request>()
        const authHeader =  request.headers['authorization']
        const sepayApiKey = process.env.SEPAY_API_KEY
        if(!authHeader || !authHeader.includes(sepayApiKey as string)){
            throw new UnauthorizedException('Loi xac thuc')
        }
        return true
    }
}