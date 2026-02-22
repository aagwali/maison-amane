import {
  type ChangeEvent,
  type DragEvent,
  type Dispatch,
  type SetStateAction,
  useState,
  useCallback,
} from 'react'
import { TaggedError } from 'effect/Data'
import {
  type Effect,
  all,
  async as asyncEffect,
  catchAll,
  ensuring,
  fail,
  gen,
  promise as promiseEffect,
  runPromise,
  succeed,
  sync,
} from 'effect/Effect'

import { registerMedia } from '@/app/products/actions'
import { config } from '@/lib/config'

export interface UploadedImage {
  mediaId: string
  imageUrl: string
  filename: string
}

export interface UploadingImage {
  id: string
  filename: string
  progress: number
}

export interface UseImageUploadReturn {
  uploadedImages: UploadedImage[]
  uploadingImages: UploadingImage[]
  error: string | null
  isDragOver: boolean
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
}

// --- Erreur typée ---

class CloudinaryUploadError extends TaggedError('CloudinaryUploadError')<{
  readonly status?: number
  readonly network?: boolean
}> {}

// --- Constantes ---

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

interface CloudinaryResponse {
  secure_url: string
  original_filename: string
  format: string
  bytes: number
}

// --- Transformateurs d'état purs ---

const withUpdatedProgress =
  (tempId: string, progress: number) =>
  (prev: UploadingImage[]): UploadingImage[] =>
    prev.map((img) => (img.id === tempId ? { ...img, progress } : img))

const withoutItem =
  (tempId: string) =>
  (prev: UploadingImage[]): UploadingImage[] =>
    prev.filter((img) => img.id !== tempId)

const withPendingUploads =
  (newUploads: UploadingImage[]) =>
  (prev: UploadingImage[]): UploadingImage[] => [...prev, ...newUploads]

const withCompletedUpload =
  (image: UploadedImage) =>
  (prev: UploadedImage[]): UploadedImage[] => [...prev, image]

// --- Upload Cloudinary via XHR (asyncEffect pour le support de onprogress) ---

const uploadToCloudinary = (
  file: File,
  onProgress: (n: number) => void
): Effect<CloudinaryResponse, CloudinaryUploadError> =>
  asyncEffect((resume) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', config.cloudinary.uploadPreset)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', config.cloudinary.uploadUrl)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resume(succeed(JSON.parse(xhr.responseText) as CloudinaryResponse))
      } else {
        resume(fail(new CloudinaryUploadError({ status: xhr.status })))
      }
    }

    xhr.onerror = () => resume(fail(new CloudinaryUploadError({ network: true })))

    xhr.send(formData)
  })

// --- Pipeline par fichier ---

const uploadOneFile = (
  file: File,
  currentId: string,
  setUploadingImages: Dispatch<SetStateAction<UploadingImage[]>>,
  setUploadedImages: Dispatch<SetStateAction<UploadedImage[]>>,
  setError: Dispatch<SetStateAction<string | null>>
) =>
  gen(function* () {
    const cloudinaryResult = yield* uploadToCloudinary(file, (progress) =>
      setUploadingImages(withUpdatedProgress(currentId, progress))
    )

    const result = yield* promiseEffect(() =>
      registerMedia({
        externalUrl: cloudinaryResult.secure_url,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      })
    )

    if ('error' in result) {
      yield* sync(() => setError(result.error))
    } else {
      const newImage = { mediaId: result.mediaId, imageUrl: result.imageUrl, filename: file.name }
      yield* sync(() => setUploadedImages(withCompletedUpload(newImage)))
    }
  })
    .pipe(catchAll(() => sync(() => setError(`Erreur lors de l'upload de ${file.name}`))),
    ensuring(sync(() => setUploadingImages(withoutItem(currentId)))))

// --- Hook ---

export function useImageUpload(initialImages?: UploadedImage[]): UseImageUploadReturn {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages ?? [])
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFiles = useCallback((files: FileList | File[]) => {
    const program = gen(function* () {
      const fileArray = Array.from(files)

      const validFiles = fileArray.filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`Type de fichier non supporté : ${file.name}`)
          return false
        }
        if (file.size > MAX_SIZE) {
          setError(`Fichier trop volumineux (max 10 MB) : ${file.name}`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      yield* sync(() => setError(null))

      const newUploading: UploadingImage[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        filename: file.name,
        progress: 0,
      }))

      yield* sync(() => setUploadingImages(withPendingUploads(newUploading)))

      yield* all(
        validFiles.map((file, index) =>
          uploadOneFile(
            file,
            newUploading[index].id,
            setUploadingImages,
            setUploadedImages,
            setError
          )
        ),
        { concurrency: 'unbounded' }
      )
    })

    // runPromise sans await — les handlers React sont fire-and-forget
    void runPromise(program)
  }, [])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const onFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
    },
    [processFiles]
  )

  return {
    uploadedImages,
    uploadingImages,
    error,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
  }
}
