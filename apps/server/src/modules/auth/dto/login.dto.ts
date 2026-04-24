import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: '登录用户名',
    example: 'admin',
  })
  username!: string

  @ApiProperty({
    description: '登录密码',
    example: 'admin123456',
  })
  password!: string
}
