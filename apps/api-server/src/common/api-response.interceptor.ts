import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { map } from 'rxjs'
import type { ApiSuccessResponse } from '@repo/types'

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<{ url?: string }>()

    return next.handle().pipe(
      map((data) => {
        if (this.isApiSuccessResponse(data)) {
          return data
        }

        return {
          success: true,
          data,
          meta: {
            path: request.url ?? '',
            timestamp: new Date().toISOString()
          }
        }
      })
    )
  }

  private isApiSuccessResponse(value: unknown): value is ApiSuccessResponse<T> {
    return typeof value === 'object'
      && value !== null
      && 'success' in value
      && (value as { success?: unknown }).success === true
      && 'data' in value
  }
}
