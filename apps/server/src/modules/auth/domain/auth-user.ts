import { UserRole } from './user-role.enum';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
}
