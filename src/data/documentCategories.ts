import type { DocumentCategory } from '../types/api';

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'ordonnance', label: 'Ordonnance' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'certificat_vaccination', label: 'Certificat de vaccination' },
  { value: 'autre', label: 'Autre' },
];

export function getCategoryLabel(category: DocumentCategory): string {
  return DOCUMENT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
