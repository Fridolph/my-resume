import { ApiProperty } from '@nestjs/swagger'

/**
 * Swagger schema for standard API response envelope
 */
export class ApiResponseEnvelopeDto {
  @ApiProperty({
    description: '业务状态码，通常与 HTTP 状态码一致',
    example: 200,
  })
  code!: number

  @ApiProperty({
    description: '响应消息',
    example: 'OK',
  })
  message!: string

  @ApiProperty({
    description: '业务数据载荷',
    nullable: true,
  })
  data!: unknown

  @ApiProperty({
    description: '服务端响应时间（ISO8601）',
    example: '2026-04-20T12:00:00.000Z',
  })
  timestamp!: string

  @ApiProperty({
    description: '链路追踪 ID',
    example: 'f7b0f02a-ded7-4b7a-b505-fd00f8bf8e63',
  })
  traceId!: string
}
