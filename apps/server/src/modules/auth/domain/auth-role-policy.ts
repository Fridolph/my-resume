import { UserRole } from './user-role.enum';

export interface RoleCapabilities {
  canAccessAdminSurface: boolean;
  canReadPublishedResume: boolean;
  canReadViewerExperience: boolean;
  canEditResume: boolean;
  canPublishResume: boolean;
  canTriggerAiAnalysis: boolean;
}

const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  [UserRole.ADMIN]: {
    canAccessAdminSurface: true,
    canReadPublishedResume: true,
    canReadViewerExperience: true,
    canEditResume: true,
    canPublishResume: true,
    canTriggerAiAnalysis: true,
  },
  [UserRole.VIEWER]: {
    canAccessAdminSurface: true,
    canReadPublishedResume: true,
    canReadViewerExperience: true,
    canEditResume: false,
    canPublishResume: false,
    canTriggerAiAnalysis: false,
  },
};

export function buildRoleCapabilities(role: UserRole): RoleCapabilities {
  return ROLE_CAPABILITIES[role];
}

export function canAccessAdminSurface(role: UserRole): boolean {
  return buildRoleCapabilities(role).canAccessAdminSurface;
}

export function canReadPublishedResume(role: UserRole): boolean {
  return buildRoleCapabilities(role).canReadPublishedResume;
}

export function canReadViewerExperience(role: UserRole): boolean {
  return buildRoleCapabilities(role).canReadViewerExperience;
}

export function canEditResume(role: UserRole): boolean {
  return buildRoleCapabilities(role).canEditResume;
}

export function canPublishResume(role: UserRole): boolean {
  return buildRoleCapabilities(role).canPublishResume;
}

export function canTriggerAiAnalysis(role: UserRole): boolean {
  return buildRoleCapabilities(role).canTriggerAiAnalysis;
}
