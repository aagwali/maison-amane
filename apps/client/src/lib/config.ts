// ============================================
// CLIENT CONFIGURATION — browser-safe only.
// Only NEXT_PUBLIC_* vars here (statically replaced at build time by Next.js).
//
// For server-only config (API_URL, secrets), see config.server.ts.
// ============================================

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const config = {
  cloudinary: {
    cloudName: required(
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ),
    uploadPreset: required(
      'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    ),
    get uploadUrl() {
      return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`
    },
  },
}
