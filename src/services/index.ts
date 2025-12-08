// src/services/index.ts
// Service exports

export { default as translationService, SUPPORTED_LANGUAGES } from './translationService';
export type { 
  SupportedLanguageCode, 
  TranslationCacheEntry, 
  BulkTranslationRequest, 
  BulkTranslationResult 
} from './translationService';
