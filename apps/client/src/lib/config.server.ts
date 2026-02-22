// ============================================
// SERVER CONFIGURATION — never exposed to the browser.
// Next.js will throw a build error if a client component imports this file.
// ============================================
import 'server-only'

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const serverConfig = {
  apiUrl: required('API_URL', process.env.API_URL),
}
