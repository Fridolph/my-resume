/**
 * Standard API response envelope
 */
export interface ApiResponseEnvelope<T = unknown> {
  code: number
  data: T
  message: string
  timestamp: string
  traceId: string
}

/**
 * Standard API error response envelope
 */
export type ApiErrorResponseEnvelope = ApiResponseEnvelope<null>
