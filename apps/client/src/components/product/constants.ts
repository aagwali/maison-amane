import { tokens } from '@/theme/theme'

export const viewTypeLabels: Record<string, string> = {
  FRONT: 'Face',
  BACK: 'Dos',
  DETAIL: 'Détail',
  AMBIANCE: 'Ambiance',
}

export const typeLabels: Record<string, string> = {
  TAPIS: 'Tapis',
  COUSSIN: 'Coussin',
  POUF: 'Pouf',
}

export const shapeLabels: Record<string, string> = {
  STANDARD: 'Standard',
  RUNNER: 'Runner',
}

export const materialLabels: Record<string, string> = {
  MTIRT: 'Mtirt',
  BENI_OUARAIN: 'Béni Ouarain',
  AZILAL: 'Azilal',
}

export const sizeLabels: Record<string, string> = {
  EXTRA_SMALL: 'XS',
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
  EXTRA_LARGE: 'XL',
}

export const statusConfig: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: 'Publié', color: '#4a7a40' },
  DRAFT: { label: 'Brouillon', color: '#8b8635' },
  ARCHIVED: { label: 'Archivé', color: '#8a8a8a' },
}

export function getStatusProps(status: string): { label: string; color: string } {
  return statusConfig[status] ?? { label: status, color: tokens.pewter }
}
