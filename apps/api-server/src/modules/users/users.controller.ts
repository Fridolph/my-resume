import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common'
import { createUserSchema, updateUserSchema } from './users.schema.js'
import { UsersService } from './users.service.js'

@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  async listUsers() {
    return await this.usersService.listUsers()
  }

  @Post()
  async createUser(@Body() body: unknown) {
    const parsed = createUserSchema.parse(body)
    return await this.usersService.createUser(parsed)
  }

  @Put(':userId')
  async updateUser(@Param('userId') userId: string, @Body() body: unknown) {
    const parsed = updateUserSchema.parse(body)
    return await this.usersService.updateUser(userId, parsed)
  }
}
