import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

//TODO: local developement stub, will be replaced for production
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV !== 'development') {
      throw new UnauthorizedException(
        'Development authentication is disabled.',
      );
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    request.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
    };

    return true;
  }
}
