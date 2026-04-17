import type { Request, Response } from 'express'

export const TRACE_ID_HEADER = 'x-trace-id'

export interface RequestWithTraceId extends Request {
  traceId?: string
}

/**
 * Resolve trace id from request or response context
 * @param request Express request
 * @param response Express response
 * @returns trace id string
 */
export function resolveTraceId(request: RequestWithTraceId, response: Response): string {
  const responseHeaderTraceId = response.getHeader(TRACE_ID_HEADER)
  if (typeof responseHeaderTraceId === 'string' && responseHeaderTraceId.trim().length > 0) {
    return responseHeaderTraceId
  }

  if (typeof request.traceId === 'string' && request.traceId.trim().length > 0) {
    return request.traceId
  }

  const requestHeaderTraceId = request.headers[TRACE_ID_HEADER]
  if (typeof requestHeaderTraceId === 'string' && requestHeaderTraceId.trim().length > 0) {
    return requestHeaderTraceId
  }

  return 'unknown'
}
