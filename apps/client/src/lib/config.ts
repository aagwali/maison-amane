// ============================================
// CLIENT CONFIGURATION
// Single source of truth for all env vars.
//
// NOTE: NEXT_PUBLIC_* vars must be accessed with literal syntax here —
// Next.js replaces them statically at build time and cannot resolve
// dynamic access like process.env[name].
// ============================================

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const config = {
  apiUrl: required('API_URL', process.env.API_URL),

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
