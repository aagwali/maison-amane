import type { Instrumentation } from 'next'

type ApiEnrichedError = Error & {
  digest?: string
  correlationId?: string
  code?: string
  apiStatus?: number
  apiType?: string
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const err = (error instanceof Error ? error : new Error(String(error))) as ApiEnrichedError

  console.error('[server-error]', {
    digest: err.digest,
    correlationId: err.correlationId,
    code: err.code,
    apiStatus: err.apiStatus,
    apiType: err.apiType,
    message: err.message,
    route: context.routePath,
    routeType: context.routeType,
    path: request.path,
    method: request.method,
  })
}
