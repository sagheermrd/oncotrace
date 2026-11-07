import type { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
