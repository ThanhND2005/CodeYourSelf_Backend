import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './role.decorator'
import { AuthRequest } from './auth.interface'


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true
        }
        const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
       
        const request = context.switchToHttp().getRequest<AuthRequest>()
        const user = request.user
      
        if (!user || !rolesArray.includes(user.role)) {
            throw new ForbiddenException("Không có quyền hạn thực hiện hành động")
        }
        return true
    }


}