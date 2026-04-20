import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiEnvelopeResponse } from './common/swagger/api-envelope-response.decorator'
import { AppService } from './app.service'

@Controller()
@ApiTags('System')
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: '服务健康检查',
    description: '返回服务基础状态字符串',
  })
  @ApiEnvelopeResponse({
    description: '健康检查成功',
  })
  getHello(): string {
    return this.appService.getHello()
  }
}
