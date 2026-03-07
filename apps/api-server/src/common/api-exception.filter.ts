import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { ZodError } from 'zod'
import type { ApiErrorResponse } from '@repo/types'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<{ status: (code: number) => { json: (body: ApiErrorResponse) => void } }>()
    const request = context.getRequest<{ url?: string }>()

    const errorResponse = this.normalizeException(exception, request.url ?? '')

    if (!(exception instanceof HttpException) && !(exception instanceof ZodError)) {
      this.logger.error(exception instanceof Error ? exception.message : 'Unknown exception')
    }

    response.status(errorResponse.error.statusCode).json(errorResponse)
  }

  private normalizeException(exception: unknown, path: string): ApiErrorResponse {
    const timestamp = new Date().toISOString()

    if (exception instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求参数校验失败',
          statusCode: HttpStatus.BAD_REQUEST,
          details: exception.flatten()
        },
        meta: {
          path,
          timestamp
        }
      }
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      const normalized = typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : exceptionResponse as Record<string, unknown>

      return {
        success: false,
        error: {
          code: this.resolveErrorCode(statusCode),
          message: String(normalized.message ?? exception.message),
          statusCode,
          details: normalized
        },
        meta: {
          path,
          timestamp
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: exception instanceof Error ? exception.message : '服务器内部错误',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      },
      meta: {
        path,
        timestamp
      }
    }
  }

  private resolveErrorCode(statusCode: number) {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST'
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED'
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN'
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND'
      case HttpStatus.CONFLICT:
        return 'CONFLICT'
      default:
        return 'HTTP_ERROR'
    }
  }
}
