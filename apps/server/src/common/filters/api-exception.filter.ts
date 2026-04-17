import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Response } from 'express'

import {
  resolveTraceId,
  type RequestWithTraceId,
} from '../http/trace-id'
import type { ApiErrorResponseEnvelope } from '../types/api-response-envelope.types'

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeExceptionMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const responseBody = exception.getResponse()

    if (typeof responseBody === 'string' && responseBody.trim()) {
      return responseBody
    }

    if (isObjectRecord(responseBody)) {
      if (Array.isArray(responseBody.message)) {
        const joinedMessage = responseBody.message
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .join('；')

        if (joinedMessage) {
          return joinedMessage
        }
      }

      if (typeof responseBody.message === 'string' && responseBody.message.trim()) {
        return responseBody.message
      }

      if (typeof responseBody.error === 'string' && responseBody.error.trim()) {
        return responseBody.error
      }
    }

    if (typeof exception.message === 'string' && exception.message.trim()) {
      return exception.message
    }
  }

  if (exception instanceof Error && exception.message.trim()) {
    return exception.message
  }

  return 'Internal server error'
}

/**
 * Normalize all HTTP errors into standard response envelope
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  /**
   * Catch and serialize thrown exceptions
   * @param exception thrown exception
   * @param host arguments host
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const request = http.getRequest<RequestWithTraceId>()
    const response = http.getResponse<Response>()

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const payload: ApiErrorResponseEnvelope = {
      code: statusCode,
      data: null,
      message: normalizeExceptionMessage(exception),
      timestamp: new Date().toISOString(),
      traceId: resolveTraceId(request, response),
    }

    response.status(statusCode).json(payload)
  }
}
