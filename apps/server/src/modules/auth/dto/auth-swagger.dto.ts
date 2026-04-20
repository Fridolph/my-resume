import { ApiProperty } from '@nestjs/swagger'

export class RoleCapabilitiesDto {
  @ApiProperty({ example: true })
  canAccessAdminSurface!: boolean

  @ApiProperty({ example: true })
  canReadPublishedResume!: boolean

  @ApiProperty({ example: true })
  canReadViewerExperience!: boolean

  @ApiProperty({ example: true })
  canEditResume!: boolean

  @ApiProperty({ example: true })
  canPublishResume!: boolean

  @ApiProperty({ example: true })
  canTriggerAiAnalysis!: boolean
}

export class AuthUserViewDto {
  @ApiProperty({ example: 'admin-demo-user' })
  id!: string

  @ApiProperty({ example: 'admin' })
  username!: string

  @ApiProperty({ example: 'admin' })
  role!: string

  @ApiProperty({ example: true })
  isActive!: boolean

  @ApiProperty({ type: () => RoleCapabilitiesDto })
  capabilities!: RoleCapabilitiesDto
}

export class LoginResultDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-token',
  })
  accessToken!: string

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer'

  @ApiProperty({ example: 3600 })
  expiresIn!: number

  @ApiProperty({ type: () => AuthUserViewDto })
  user!: AuthUserViewDto
}

export class CurrentUserPayloadDto {
  @ApiProperty({ type: () => AuthUserViewDto })
  user!: AuthUserViewDto
}

export class DemoProtectedActionPayloadDto {
  @ApiProperty({
    example: 'viewer read-only experience is available',
  })
  message!: string

  @ApiProperty({ type: () => AuthUserViewDto })
  user!: AuthUserViewDto
}
