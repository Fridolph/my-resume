import { Body, Controller, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { createUserSchema, updateUserSchema } from './users.schema.js'
import { UsersService } from './users.service.js'

@Controller('admin/users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('user.read')
  @Get()
  async listUsers() {
    return await this.usersService.listUsers()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('user.write')
  @Post()
  async createUser(@Body() body: unknown) {
    const parsed = createUserSchema.parse(body)
    return await this.usersService.createUser(parsed)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('user.write')
  @Put(':userId')
  async updateUser(@Param('userId') userId: string, @Body() body: unknown) {
    const parsed = updateUserSchema.parse(body)
    return await this.usersService.updateUser(userId, parsed)
  }
}
