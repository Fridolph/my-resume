import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  type INestApplication,
  Module,
  Res,
} from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import type { Response } from 'express'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SkipResponseEnvelope } from '../decorators/skip-response-envelope.decorator'
import { ApiExceptionFilter } from '../filters/api-exception.filter'
import { ResponseEnvelopeInterceptor } from '../interceptors/response-envelope.interceptor'
import { TRACE_ID_HEADER } from '../http/trace-id'

@Controller('test-envelope')
class TestEnvelopeController {
  @Get('ok')
  getOk() {
    return {
      foo: 'bar',
    }
  }

  @Get('bad')
  @HttpCode(HttpStatus.BAD_REQUEST)
  getBad() {
    throw new BadRequestException('bad request payload')
  }

  @Get('raw')
  @SkipResponseEnvelope()
  getRaw(@Res() response: Response) {
    response.status(HttpStatus.OK).send('raw-body')
  }
}

@Module({
  controllers: [TestEnvelopeController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
class TestEnvelopeModule {}

describe('api response envelope', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestEnvelopeModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('wraps success payload with standard response envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-envelope/ok')
      .set(TRACE_ID_HEADER, 'trace-success')
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(response.body.message).toBe('OK')
    expect(response.body.data).toEqual({ foo: 'bar' })
    expect(response.body.traceId).toBe('trace-success')
    expect(typeof response.body.timestamp).toBe('string')
  })

  it('normalizes thrown exceptions into standard error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-envelope/bad')
      .set(TRACE_ID_HEADER, 'trace-error')
      .expect(400)

    expect(response.body.code).toBe(400)
    expect(response.body.message).toBe('bad request payload')
    expect(response.body.data).toBeNull()
    expect(response.body.traceId).toBe('trace-error')
    expect(typeof response.body.timestamp).toBe('string')
  })

  it('keeps raw response handlers outside envelope wrapping', async () => {
    const response = await request(app.getHttpServer()).get('/test-envelope/raw').expect(200)

    expect(response.text).toBe('raw-body')
  })
})
