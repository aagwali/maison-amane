import type { Option } from 'effect'

interface ApiErrorLike {
  readonly correlationId: string
  readonly code: string
  readonly status: number
  readonly type: string
}

const isApiError = (value: unknown): value is ApiErrorLike =>
  typeof value === 'object' && value !== null && 'correlationId' in value

export const throwApiError = (message: string, failure: Option.Option<unknown>): never => {
  const apiError = failure._tag === 'Some' && isApiError(failure.value) ? failure.value : undefined

  throw Object.assign(new Error(message), {
    correlationId: apiError?.correlationId,
    code: apiError?.code,
    apiStatus: apiError?.status,
    apiType: apiError?.type,
  })
}
