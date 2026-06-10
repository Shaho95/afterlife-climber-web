export type LanguageCode = 'sv' | 'en' | 'es' | 'pt' | 'it' | 'ar' | 'de';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'sv', label: 'Svenska' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' }
];

export const DEFAULT_LANGUAGE: LanguageCode = 'sv';

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_OPTIONS.some((option) => option.code === value);
}

export function getLanguageLabel(code: LanguageCode): string {
  return LANGUAGE_OPTIONS.find((option) => option.code === code)?.label ?? 'Svenska';
}
