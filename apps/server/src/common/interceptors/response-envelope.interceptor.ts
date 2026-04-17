import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { Response } from 'express'

import {
  SKIP_RESPONSE_ENVELOPE,
} from '../decorators/skip-response-envelope.decorator'
import {
  resolveTraceId,
  type RequestWithTraceId,
} from '../http/trace-id'
import type { ApiResponseEnvelope } from '../types/api-response-envelope.types'

interface EnvelopeLike {
  code?: number
  data?: unknown
  message?: string
  timestamp?: string
  traceId?: string
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEnvelopeLike(value: unknown): value is EnvelopeLike {
  return isObjectRecord(value) && ('code' in value || 'data' in value || 'message' in value)
}

function normalizeSuccessMessage(statusCode: number, payload: unknown): string {
  if (isObjectRecord(payload) && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (statusCode === HttpStatus.CREATED) {
    return 'Created'
  }

  return 'OK'
}

/**
 * Wrap successful HTTP payloads into a standard envelope
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiResponseEnvelope<T | unknown>>
{
  /**
   * Intercept controller success responses and normalize shape
   * @param context Nest execution context
   * @param next Next call handler
   * @returns wrapped response stream
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseEnvelope<T>> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const shouldSkip =
      Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE, context.getHandler()) === true ||
      Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE, context.getClass()) === true

    if (shouldSkip) {
      return next.handle()
    }

    const http = context.switchToHttp()
    const request = http.getRequest<RequestWithTraceId>()
    const response = http.getResponse<Response>()

    return next.handle().pipe(
      map((payload: unknown) => {
        const statusCode = response.statusCode || HttpStatus.OK
        const timestamp = new Date().toISOString()
        const traceId = resolveTraceId(request, response)

        // If controller already returns envelope-like data, only fill missing fields
        if (isEnvelopeLike(payload)) {
          const envelope = payload as EnvelopeLike
          return {
            code: envelope.code ?? statusCode,
            data: (envelope.data ?? null) as T,
            message: envelope.message ?? normalizeSuccessMessage(statusCode, envelope),
            timestamp: envelope.timestamp ?? timestamp,
            traceId: envelope.traceId ?? traceId,
          }
        }

        return {
          code: statusCode,
          data: (payload ?? null) as T,
          message: normalizeSuccessMessage(statusCode, payload),
          timestamp,
          traceId,
        }
      }),
    )
  }
}
