// src/hooks/useTranslation.ts
// React hook for efficient translations with automatic caching

import { useState, useEffect, useCallback, useRef } from 'react';
import translationService, { 
  SupportedLanguageCode, 
  SUPPORTED_LANGUAGES 
} from '../services/translationService';

export interface UseTranslationOptions {
  /** Source language for translations */
  sourceLang?: SupportedLanguageCode;
  /** Whether to translate HTML content */
  isHtml?: boolean;
  /** Debounce delay for batch translations */
  debounceMs?: number;
}

export interface TranslationState {
  isLoading: boolean;
  error: string | null;
  stats: { fromCache: number; fromApi: number };
}

/**
 * Hook for translating individual strings
 */
export function useTranslate(
  targetLang: SupportedLanguageCode,
  options: UseTranslationOptions = {}
) {
  const { sourceLang = 'en', isHtml = false } = options;
  const [state, setState] = useState<TranslationState>({
    isLoading: false,
    error: null,
    stats: { fromCache: 0, fromApi: 0 },
  });

  const translate = useCallback(async (text: string): Promise<string> => {
    if (!text || sourceLang === targetLang) return text;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await translationService.translate(text, sourceLang, targetLang, isHtml);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return text;
    }
  }, [sourceLang, targetLang, isHtml]);

  return { translate, ...state };
}

/**
 * Hook for translating multiple strings at once (bulk)
 */
export function useBulkTranslate(
  targetLang: SupportedLanguageCode,
  options: UseTranslationOptions = {}
) {
  const { sourceLang = 'en', isHtml = false } = options;
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [state, setState] = useState<TranslationState>({
    isLoading: false,
    error: null,
    stats: { fromCache: 0, fromApi: 0 },
  });

  const translateBulk = useCallback(async (texts: string[]): Promise<Map<string, string>> => {
    if (texts.length === 0 || sourceLang === targetLang) {
      const result = new Map(texts.map(t => [t, t]));
      setTranslations(result);
      return result;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await translationService.translateBulk({
        texts,
        sourceLang,
        targetLang,
        isHtml,
      });

      setTranslations(result.translations);
      setState(prev => ({
        ...prev,
        isLoading: false,
        stats: { fromCache: result.fromCache, fromApi: result.fromApi },
      }));

      return result.translations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk translation failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return new Map(texts.map(t => [t, t]));
    }
  }, [sourceLang, targetLang, isHtml]);

  const getTranslation = useCallback((text: string): string => {
    return translations.get(text) || text;
  }, [translations]);

  return { translateBulk, getTranslation, translations, ...state };
}

/**
 * Hook that automatically translates a dictionary of strings
 */
export function useTranslatedStrings<T extends Record<string, string>>(
  strings: T,
  targetLang: SupportedLanguageCode,
  sourceLang: SupportedLanguageCode = 'en'
) {
  const [translatedStrings, setTranslatedStrings] = useState<T>(strings);
  const [isLoading, setIsLoading] = useState(false);
  const previousLang = useRef(targetLang);

  useEffect(() => {
    if (sourceLang === targetLang) {
      setTranslatedStrings(strings);
      return;
    }

    // Only translate if language changed
    if (previousLang.current === targetLang && translatedStrings !== strings) {
      return;
    }
    previousLang.current = targetLang;

    const translateAll = async () => {
      setIsLoading(true);
      try {
        const result = await translationService.translateBulk({
          texts: Object.values(strings),
          sourceLang,
          targetLang,
        });

        const translated = { ...strings } as T;
        Object.keys(strings).forEach(key => {
          const original = strings[key];
          const translatedValue = result.translations.get(original);
          if (translatedValue) {
            (translated as any)[key] = translatedValue;
          }
        });

        setTranslatedStrings(translated);
      } catch (error) {
        console.error('Failed to translate strings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    translateAll();
  }, [strings, sourceLang, targetLang]);

  return { strings: translatedStrings, isLoading };
}

/**
 * Hook for translating HTML content safely
 */
export function useHtmlTranslation(
  targetLang: SupportedLanguageCode,
  sourceLang: SupportedLanguageCode = 'en'
) {
  const [isLoading, setIsLoading] = useState(false);

  const translateHtml = useCallback(async (html: string): Promise<string> => {
    if (!html || sourceLang === targetLang) return html;

    setIsLoading(true);
    try {
      const result = await translationService.translateHtml(html, sourceLang, targetLang);
      return result;
    } catch (error) {
      console.error('HTML translation failed:', error);
      return html;
    } finally {
      setIsLoading(false);
    }
  }, [sourceLang, targetLang]);

  return { translateHtml, isLoading };
}

/**
 * Hook for preloading translations (useful for static content)
 */
export function usePreloadTranslations() {
  const [isPreloading, setIsPreloading] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  const preload = useCallback(async (
    texts: string[],
    targetLanguages: SupportedLanguageCode[],
    sourceLang: SupportedLanguageCode = 'en'
  ) => {
    setIsPreloading(true);
    setProgress({ loaded: 0, total: targetLanguages.length });

    try {
      for (let i = 0; i < targetLanguages.length; i++) {
        await translationService.translateBulk({
          texts,
          sourceLang,
          targetLang: targetLanguages[i],
        });
        setProgress({ loaded: i + 1, total: targetLanguages.length });
      }
    } catch (error) {
      console.error('Preload failed:', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  return { preload, isPreloading, progress };
}

/**
 * Get available languages
 */
export function useAvailableLanguages() {
  return Object.values(SUPPORTED_LANGUAGES);
}

export default useTranslate;
