// Manages Shopify Admin API access tokens using the client credentials grant.
// Tokens expire after 24h — this provider caches and auto-refreshes them.

import { Context, Layer, Redacted, Ref } from 'effect'
import { type Effect, gen, logInfo, logWarning, tryPromise } from 'effect/Effect'
import { ShopifyConfig, type ShopifyConfigValue } from '@maison-amane/shared-kernel'

import { ShopifyClientError } from '../../../ports/driven'

// ============================================
// TOKEN PROVIDER PORT
// ============================================

export interface ShopifyTokenProviderService {
  readonly getAccessToken: Effect<Redacted.Redacted<string>, ShopifyClientError>
}

export class ShopifyTokenProvider extends Context.Tag('ShopifyTokenProvider')<
  ShopifyTokenProvider,
  ShopifyTokenProviderService
>() {}

// ============================================
// TOKEN STATE
// ============================================

interface TokenState {
  readonly accessToken: Redacted.Redacted<string>
  readonly expiresAt: number // Unix timestamp ms
}

const REFRESH_MARGIN_MS = 5 * 60 * 1000 // Refresh 5 min before expiry

// ============================================
// CLIENT CREDENTIALS GRANT
// ============================================

interface TokenResponse {
  readonly access_token: string
  readonly scope: string
  readonly expires_in: number
}

const fetchToken = (config: ShopifyConfigValue): Effect<TokenResponse, ShopifyClientError> =>
  tryPromise({
    try: async () => {
      const result = await fetch(`${config.storeUrl}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: Redacted.value(config.clientSecret),
        }),
      })
      if (!result.ok) {
        const body = await result.text().catch(() => '')
        throw new Error(`HTTP ${result.status}: ${result.statusText} — ${body}`)
      }
      return result.json() as Promise<TokenResponse>
    },
    catch: (error) => new ShopifyClientError({ operation: 'fetchAccessToken', cause: error }),
  })

// ============================================
// IMPLEMENTATION
// ============================================

const createTokenProvider = (
  config: ShopifyConfigValue,
  stateRef: Ref.Ref<TokenState | null>
): ShopifyTokenProviderService => ({
  getAccessToken: gen(function* () {
    const current = yield* Ref.get(stateRef)
    const now = Date.now()

    if (current && current.expiresAt > now + REFRESH_MARGIN_MS) {
      return current.accessToken
    }

    if (current) {
      yield* logWarning('Shopify token expired or expiring soon, refreshing')
    } else {
      yield* logInfo('Shopify token: fetching initial access token')
    }

    const response = yield* fetchToken(config)

    const newState: TokenState = {
      accessToken: Redacted.make(response.access_token),
      expiresAt: now + response.expires_in * 1000,
    }

    yield* Ref.set(stateRef, newState)

    yield* logInfo('Shopify token: obtained new access token')

    return newState.accessToken
  }),
})

// ============================================
// LAYER (depends on ShopifyConfig)
// ============================================

export const ShopifyTokenProviderLive = Layer.effect(
  ShopifyTokenProvider,
  gen(function* () {
    const config = yield* ShopifyConfig
    const stateRef = yield* Ref.make<TokenState | null>(null)
    return createTokenProvider(config, stateRef)
  })
)
