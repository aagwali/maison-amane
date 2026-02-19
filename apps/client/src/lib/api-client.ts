import { FetchHttpClient, HttpApiClient } from '@effect/platform'
import { MaisonAmaneApi } from '@maison-amane/api'
import { type Effect, gen, provide, runPromiseExit } from 'effect/Effect'
import { type Exit } from 'effect/Exit'

const BASE_URL = process.env.API_URL ?? 'http://localhost:3001'

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
): Promise<Exit<A, E>> => runPromiseExit(withClient(call))
