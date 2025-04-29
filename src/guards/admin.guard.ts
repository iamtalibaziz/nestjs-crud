import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserStatus, UserType } from 'src/dataTypes/user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return (
      request.user &&
      request.user.status === UserStatus.ACTIVE &&
      request.user.userType === UserType.STAFF
    );
  }
}
