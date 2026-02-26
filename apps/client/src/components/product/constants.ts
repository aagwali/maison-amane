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

export const categoryLabels: Record<string, string> = {
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  COLLECTION: 'Collection',
}

export const priceLabels: Record<string, string> = {
  ECONOMIQUE: 'Économique',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  LUXE: 'Luxe',
}

export const sizeLabels: Record<string, string> = {
  PETIT: 'Petit',
  REGULAR: 'Régulier',
  GRAND: 'Grand',
  SUR_MESURE: 'Sur mesure',
}

export const statusConfig: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: 'Publié', color: '#4a7a40' },
  DRAFT: { label: 'Brouillon', color: '#8b8635' },
  ARCHIVED: { label: 'Archivé', color: '#8a8a8a' },
}

export function getStatusProps(status: string): { label: string; color: string } {
  return statusConfig[status] ?? { label: status, color: tokens.pewter }
}
