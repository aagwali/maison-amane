// src/domain/media/index.ts

// ============================================
// VALUE OBJECTS
// ============================================
export {
  // IDs
  MediaIdSchema,
  type MediaId,
  makeMediaId,
  // Scalar Types
  MediaUrlSchema,
  type MediaUrl,
  makeMediaUrl,
  MimeTypeSchema,
  type MimeType,
  makeMimeType,
  FileSizeSchema,
  type FileSize,
  makeFileSize,
} from './value-objects'

// ============================================
// ENUMS
// ============================================
export { MediaStatus, MediaStatusSchema } from './enums'

// ============================================
// AGGREGATE
// ============================================
export { MediaSchema, type Media, makeMedia, confirmMedia } from './aggregate'

// ============================================
// ERRORS
// ============================================
export { MediaNotFoundError, MediaAlreadyConfirmedError } from './errors'
