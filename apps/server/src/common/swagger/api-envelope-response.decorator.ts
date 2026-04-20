import { applyDecorators, type Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

import { ApiResponseEnvelopeDto } from './api-response-envelope.dto'

interface ApiEnvelopeResponseOptions {
  description: string
  isArray?: boolean
  nullableData?: boolean
  status?: number
  type?: Type<unknown>
}

function buildDataSchema(options: ApiEnvelopeResponseOptions) {
  if (!options.type) {
    return {
      nullable: options.nullableData ?? false,
      type: 'object',
    }
  }

  if (options.isArray) {
    return {
      items: {
        $ref: getSchemaPath(options.type),
      },
      nullable: options.nullableData ?? false,
      type: 'array',
    }
  }

  return {
    allOf: [
      {
        $ref: getSchemaPath(options.type),
      },
    ],
    nullable: options.nullableData ?? false,
  }
}

/**
 * Declare an envelope-shaped API response in Swagger
 * @param options envelope response schema options
 * @returns method decorator
 */
export function ApiEnvelopeResponse(options: ApiEnvelopeResponseOptions) {
  const status = options.status ?? 200
  const extraModels = options.type
    ? [ApiResponseEnvelopeDto, options.type]
    : [ApiResponseEnvelopeDto]

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiResponse({
      description: options.description,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(ApiResponseEnvelopeDto),
          },
          {
            properties: {
              data: buildDataSchema(options),
            },
          },
        ],
      },
      status,
    }),
  )
}
