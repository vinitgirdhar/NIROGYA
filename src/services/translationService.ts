// src/services/translationService.ts
// Optimized translation service with caching, bulk translation, and HTML support

const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate';
const CACHE_DB_NAME = 'nirogya_translation_cache';
const CACHE_DB_VERSION = 1;
const CACHE_STORE_NAME = 'translations';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Supported languages with LibreTranslate codes
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🌾' },
  as: { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🏔️' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🏛️' },
  // Languages that may need fallback (not directly supported by LibreTranslate)
  kha: { code: 'kha', name: 'Khasi', nativeName: 'কা খাসি', flag: '⛰️', fallback: 'en' },
  grt: { code: 'grt', name: 'Garo', nativeName: 'আ•চিক কাতা', flag: '🌲', fallback: 'bn' },
  lus: { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', flag: '🌿', fallback: 'en' },
  mni: { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🏔️', fallback: 'bn' },
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface TranslationCacheEntry {
  id?: number;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  translatedText: string;
  isHtml: boolean;
  cachedAt: number;
  accessCount: number;
}

export interface BulkTranslationRequest {
  texts: string[];
  sourceLang: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  isHtml?: boolean;
}

export interface BulkTranslationResult {
  translations: Map<string, string>;
  fromCache: number;
  fromApi: number;
  errors: string[];
}

class TranslationCache {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;
  private memoryCache: Map<string, TranslationCacheEntry> = new Map();
  private readonly maxMemoryCacheSize = 1000;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        // Fallback to memory-only cache
        console.warn('IndexedDB not available, using memory cache only');
        resolve(null as any);
        return;
      }

      const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open translation cache DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const store = db.createObjectStore(CACHE_STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Composite index for fast lookups
          store.createIndex('lookup', ['sourceText', 'sourceLang', 'targetLang'], { unique: true });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
          store.createIndex('targetLang', 'targetLang', { unique: false });
        }
      };
    });
  }

  private generateCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  async get(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
    const cacheKey = this.generateCacheKey(text, sourceLang, targetLang);
    
    // Check memory cache first
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry && Date.now() - memEntry.cachedAt < CACHE_EXPIRY_MS) {
      memEntry.accessCount++;
      return memEntry.translatedText;
    }

    // Check IndexedDB
    await this.dbReady;
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(CACHE_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const index = store.index('lookup');
      const request = index.get([text, sourceLang, targetLang]);

      request.onsuccess = () => {
        const entry = request.result as TranslationCacheEntry | undefined;
        if (entry && Date.now() - entry.cachedAt < CACHE_EXPIRY_MS) {
          // Update memory cache
          this.addToMemoryCache(cacheKey, entry);
          resolve(entry.translatedText);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Cache lookup error:', request.error);
        resolve(null);
      };
    });
  }

  async set(
    text: string, 
    sourceLang: string, 
    targetLang: string, 
    translatedText: string,
    isHtml: boolean = false
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(text, sourceLang, targetLang);
    const entry: TranslationCacheEntry = {
      sourceText: text,
      sourceLang,
      targetLang,
      translatedText,
      isHtml,
      cachedAt: Date.now(),
      accessCount: 1,
    };

    // Add to memory cache
    this.addToMemoryCache(cacheKey, entry);

    // Add to IndexedDB
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(CACHE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      
      // Check if entry exists
      const index = store.index('lookup');
      const getRequest = index.get([text, sourceLang, targetLang]);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          // Update existing
          entry.id = getRequest.result.id;
          store.put(entry);
        } else {
          store.add(entry);
        }
        resolve();
      };

      getRequest.onerror = () => {
        store.add(entry);
        resolve();
      };
    });
  }

  async getBulk(
    texts: string[], 
    sourceLang: string, 
    targetLang: string
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    await Promise.all(
      texts.map(async (text) => {
        const cached = await this.get(text, sourceLang, targetLang);
        if (cached) {
          results.set(text, cached);
        }
      })
    );

    return results;
  }

  async setBulk(
    translations: Map<string, string>,
    sourceLang: string,
    targetLang: string,
    isHtml: boolean = false
  ): Promise<void> {
    const promises: Promise<void>[] = [];
    
    translations.forEach((translatedText, sourceText) => {
      promises.push(this.set(sourceText, sourceLang, targetLang, translatedText, isHtml));
    });

    await Promise.all(promises);
  }

  private addToMemoryCache(key: string, entry: TranslationCacheEntry): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      // Remove least recently accessed entries
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      const toRemove = entries.slice(0, Math.floor(this.maxMemoryCacheSize * 0.2));
      toRemove.forEach(([k]) => this.memoryCache.delete(k));
    }

    this.memoryCache.set(key, entry);
  }

  async clearExpired(): Promise<number> {
    await this.dbReady;
    if (!this.db) return 0;

    const cutoff = Date.now() - CACHE_EXPIRY_MS;
    let deletedCount = 0;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(CACHE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const index = store.index('cachedAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        // Also clear from memory cache
        this.memoryCache.forEach((entry, key) => {
          if (entry.cachedAt < cutoff) {
            this.memoryCache.delete(key);
          }
        });
        resolve(deletedCount);
      };
    });
  }

  async getStats(): Promise<{ total: number; byLanguage: Record<string, number> }> {
    await this.dbReady;
    if (!this.db) {
      return { total: this.memoryCache.size, byLanguage: {} };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(CACHE_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const countRequest = store.count();
      const byLanguage: Record<string, number> = {};

      countRequest.onsuccess = () => {
        const total = countRequest.result;
        
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor) {
            const entry = cursor.value as TranslationCacheEntry;
            byLanguage[entry.targetLang] = (byLanguage[entry.targetLang] || 0) + 1;
            cursor.continue();
          }
        };

        transaction.oncomplete = () => {
          resolve({ total, byLanguage });
        };
      };
    });
  }
}

class TranslationService {
  private cache: TranslationCache;
  private pendingRequests: Map<string, Promise<string>> = new Map();
  private batchQueue: Map<string, { texts: Set<string>; resolve: (results: Map<string, string>) => void }[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchDelay = 50; // ms to wait before processing batch
  private readonly maxBatchSize = 50; // max texts per API request

  constructor() {
    this.cache = new TranslationCache();
  }

  /**
   * Get the actual API language code (handles fallbacks for unsupported languages)
   */
  private getApiLanguageCode(langCode: SupportedLanguageCode): string {
    const lang = SUPPORTED_LANGUAGES[langCode];
    if ('fallback' in lang) {
      return lang.fallback;
    }
    return lang.code;
  }

  /**
   * Check if a language needs custom/static translations (not supported by API)
   */
  private needsStaticTranslation(langCode: SupportedLanguageCode): boolean {
    const lang = SUPPORTED_LANGUAGES[langCode];
    return 'fallback' in lang;
  }

  /**
   * Translate a single text string
   */
  async translate(
    text: string,
    sourceLang: SupportedLanguageCode = 'en',
    targetLang: SupportedLanguageCode,
    isHtml: boolean = false
  ): Promise<string> {
    // Skip if source equals target
    if (sourceLang === targetLang) return text;
    
    // Skip empty strings
    if (!text.trim()) return text;

    // Check cache first
    const cached = await this.cache.get(text, sourceLang, targetLang);
    if (cached) return cached;

    // Deduplicate concurrent requests for the same text
    const requestKey = `${sourceLang}:${targetLang}:${text}`;
    const pending = this.pendingRequests.get(requestKey);
    if (pending) return pending;

    const translationPromise = this.performTranslation(text, sourceLang, targetLang, isHtml);
    this.pendingRequests.set(requestKey, translationPromise);

    try {
      const result = await translationPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Translate multiple texts in bulk (optimized)
   */
  async translateBulk(request: BulkTranslationRequest): Promise<BulkTranslationResult> {
    const { texts, sourceLang, targetLang, isHtml = false } = request;
    const result: BulkTranslationResult = {
      translations: new Map(),
      fromCache: 0,
      fromApi: 0,
      errors: [],
    };

    // Skip if source equals target
    if (sourceLang === targetLang) {
      texts.forEach(text => result.translations.set(text, text));
      return result;
    }

    // Get cached translations
    const cachedTranslations = await this.cache.getBulk(texts, sourceLang, targetLang);
    result.fromCache = cachedTranslations.size;
    cachedTranslations.forEach((value, key) => result.translations.set(key, value));

    // Find texts that need translation
    const uncachedTexts = texts.filter(t => !cachedTranslations.has(t) && t.trim());
    
    if (uncachedTexts.length === 0) {
      return result;
    }

    // Batch API calls
    const batches: string[][] = [];
    for (let i = 0; i < uncachedTexts.length; i += this.maxBatchSize) {
      batches.push(uncachedTexts.slice(i, i + this.maxBatchSize));
    }

    // Process batches in parallel (with limit)
    const batchPromises = batches.map(async (batch) => {
      try {
        const batchResults = await this.translateBatch(batch, sourceLang, targetLang, isHtml);
        return batchResults;
      } catch (error) {
        result.errors.push(`Batch translation failed: ${error}`);
        return new Map<string, string>();
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    // Merge results
    batchResults.forEach(batchMap => {
      batchMap.forEach((value, key) => {
        result.translations.set(key, value);
        result.fromApi++;
      });
    });

    return result;
  }

  /**
   * Translate a batch of texts in a single API call
   */
  private async translateBatch(
    texts: string[],
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    isHtml: boolean
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Use delimiter-based batching for non-HTML
    // For HTML, we need to be more careful
    if (!isHtml && texts.length > 1) {
      const delimiter = '\n|||DELIM|||\n';
      const combined = texts.join(delimiter);
      
      try {
        const translated = await this.callApi(combined, sourceLang, targetLang, false);
        const parts = translated.split(/\s*\|\|\|DELIM\|\|\|\s*/);
        
        if (parts.length === texts.length) {
          texts.forEach((text, i) => {
            results.set(text, parts[i].trim());
          });
          // Cache all results
          await this.cache.setBulk(results, sourceLang, targetLang, isHtml);
          return results;
        }
      } catch (error) {
        console.warn('Batch translation failed, falling back to individual:', error);
      }
    }

    // Fallback: translate individually
    const promises = texts.map(async (text) => {
      try {
        const translated = await this.performTranslation(text, sourceLang, targetLang, isHtml);
        results.set(text, translated);
      } catch (error) {
        console.error(`Failed to translate "${text}":`, error);
        results.set(text, text); // Return original on error
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Perform actual translation (with caching)
   */
  private async performTranslation(
    text: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    isHtml: boolean
  ): Promise<string> {
    try {
      const translated = await this.callApi(text, sourceLang, targetLang, isHtml);
      
      // Cache the result
      await this.cache.set(text, sourceLang, targetLang, translated, isHtml);
      
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original on error
    }
  }

  /**
   * Call the LibreTranslate API
   */
  private async callApi(
    text: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    isHtml: boolean
  ): Promise<string> {
    const apiSourceLang = this.getApiLanguageCode(sourceLang);
    const apiTargetLang = this.getApiLanguageCode(targetLang);

    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: apiSourceLang,
        target: apiTargetLang,
        format: isHtml ? 'html' : 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  }

  /**
   * Translate HTML content while preserving tags and structure
   */
  async translateHtml(
    html: string,
    sourceLang: SupportedLanguageCode = 'en',
    targetLang: SupportedLanguageCode
  ): Promise<string> {
    return this.translate(html, sourceLang, targetLang, true);
  }

  /**
   * Translate an object's string values recursively
   */
  async translateObject<T extends Record<string, any>>(
    obj: T,
    sourceLang: SupportedLanguageCode = 'en',
    targetLang: SupportedLanguageCode
  ): Promise<T> {
    if (sourceLang === targetLang) return obj;

    const result: any = Array.isArray(obj) ? [] : {};
    const textsToTranslate: string[] = [];
    const paths: string[][] = [];

    // Collect all strings
    const collectStrings = (current: any, path: string[] = []) => {
      if (typeof current === 'string' && current.trim()) {
        textsToTranslate.push(current);
        paths.push(path);
      } else if (Array.isArray(current)) {
        current.forEach((item, index) => {
          collectStrings(item, [...path, String(index)]);
        });
      } else if (current && typeof current === 'object') {
        Object.keys(current).forEach(key => {
          collectStrings(current[key], [...path, key]);
        });
      }
    };

    collectStrings(obj);

    // Bulk translate
    const { translations } = await this.translateBulk({
      texts: textsToTranslate,
      sourceLang,
      targetLang,
    });

    // Reconstruct object
    const setValueAtPath = (target: any, path: string[], value: any) => {
      let current = target;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current)) {
          current[key] = isNaN(Number(path[i + 1])) ? {} : [];
        }
        current = current[key];
      }
      current[path[path.length - 1]] = value;
    };

    // Deep clone original
    const clone = JSON.parse(JSON.stringify(obj));
    
    // Apply translations
    textsToTranslate.forEach((text, index) => {
      const translated = translations.get(text) || text;
      setValueAtPath(clone, paths[index], translated);
    });

    return clone;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    return this.cache.clearExpired();
  }

  /**
   * Preload translations for a set of texts
   */
  async preloadTranslations(
    texts: string[],
    targetLanguages: SupportedLanguageCode[],
    sourceLang: SupportedLanguageCode = 'en'
  ): Promise<void> {
    const promises = targetLanguages.map(targetLang => 
      this.translateBulk({ texts, sourceLang, targetLang })
    );
    await Promise.all(promises);
  }
}

// Singleton instance
export const translationService = new TranslationService();
export default translationService;
