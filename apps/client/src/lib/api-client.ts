import { FetchHttpClient, HttpApiClient } from '@effect/platform'
import { MaisonAmaneApi } from '@maison-amane/api'
import { Cause, Exit } from 'effect'
import { type Effect, gen, provide, runPromiseExit } from 'effect/Effect'
import { notFound } from 'next/navigation'

import { config } from './config'
import { throwApiError } from './throw-api-error'

const BASE_URL = config.apiUrl

/**
 * Effect lazy décrivant l'acquisition du client typé.
 * Utilisé aussi comme source de vérité pour le type `MaisonAmaneClient`.
 */
const clientEffect = HttpApiClient.make(MaisonAmaneApi, { baseUrl: BASE_URL })

type MaisonAmaneClient = typeof clientEffect extends Effect<infer A, any, any> ? A : never

const withClient = <A, E>(call: (client: MaisonAmaneClient) => Effect<A, E>): Effect<A, E, never> =>
  gen(function* () {
    const client = yield* clientEffect
    return yield* call(client)
  })
    .pipe(provide(FetchHttpClient.layer)) as Effect<A, E, never>

/**
 * Exécute un appel API et retourne un Exit typé.
 * Le callsite est responsable de traiter le cas d'erreur explicitement
 * (ex : ApiNotFoundError → notFound(), autres erreurs → laisser remonter).
 *
 * Usage :
 *   const exit = await runApi(client =>
 *     client['pilot-product'].getById({ path: { id } })
 *   )
 *   if (Exit.isFailure(exit)) { notFound() }
 */
export const runApi = <A, E>(
  call: (client: MaisonAmaneClient) => Effect<A, E>
): Promise<Exit.Exit<A, E>> => runPromiseExit(withClient(call))

/**
 * Variante de runApi pour les Server Components.
 * Gère automatiquement : succès → valeur, ApiNotFoundError → notFound(), autres → throw.
 *
 * Usage :
 *   const product = await runApiPage(
 *     client => client['pilot-product'].getById({ path: { id } }),
 *     { notFoundOn: 'ApiNotFoundError' }
 *   )
 */
export const runApiPage = async <A, E>(
  call: (client: MaisonAmaneClient) => Effect<A, E>,
  options?: { notFoundOn?: string }
): Promise<A> => {
  const exit = await runApi(call)

  if (Exit.isSuccess(exit)) return exit.value

  const failure = Cause.failureOption(exit.cause)
  if (
    options?.notFoundOn &&
    failure._tag === 'Some' &&
    (failure.value as Record<string, unknown>)?._tag === options.notFoundOn
  ) {
    notFound()
  }

  return throwApiError('Erreur lors du chargement', failure)
}
