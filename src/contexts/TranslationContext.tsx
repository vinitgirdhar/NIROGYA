// src/contexts/TranslationContext.tsx
// Optimized translation context with caching, bulk translation, and HTML support

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef 
} from 'react';
import translationService, { 
  SupportedLanguageCode, 
  SUPPORTED_LANGUAGES,
  BulkTranslationResult 
} from '../services/translationService';

// Re-export language types
export type { SupportedLanguageCode };
export { SUPPORTED_LANGUAGES };

// Extended language interface for UI
export interface Language {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
  fallback?: string;
}

// All supported languages with metadata
export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'International' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🏔️', region: 'Assam' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🌾', region: 'West Bengal/Tripura' },
  { code: 'kha', name: 'Khasi', nativeName: 'কা খাসি', flag: '⛰️', region: 'Meghalaya' },
  { code: 'grt', name: 'Garo', nativeName: 'আ•চিক কাতা', flag: '🌲', region: 'Meghalaya' },
  { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', flag: '🌿', region: 'Mizoram' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🏔️', region: 'Manipur' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🏛️', region: 'Maharashtra' },
];

// Static translations for quick access (most common UI strings)
// These are pre-translated and don't need API calls
export const staticTranslations: Record<string, Record<SupportedLanguageCode, string>> = {
  // Navigation
  'nav.home': {
    en: 'Home', hi: 'होम', as: 'ঘৰ', bn: 'হোম', kha: 'কা জিংইয়াহ', 
    grt: 'দাক গিমিক', lus: 'In', mni: 'য়ুম', mr: 'मुख्यपृष्ठ'
  },
  'nav.dashboard': {
    en: 'Dashboard', hi: 'डैशबोर्ड', as: 'ডেছবৰ্ড', bn: 'ড্যাশবোর্ড', kha: 'ডেশবোর্ড',
    grt: 'ডেশবোর্ড', lus: 'Dashboard', mni: 'ডেশবোর্ড', mr: 'डॅशबोर्ड'
  },
  'nav.map': {
    en: 'Map', hi: 'नक्शा', as: 'মানচিত্ৰ', bn: 'মানচিত্র', kha: 'কা মানচিত্র',
    grt: 'নাক্সা', lus: 'Map', mni: 'মেপ', mr: 'नकाशा'
  },
  'nav.alerts': {
    en: 'Alerts', hi: 'अलर्ट', as: 'সতর্কতা', bn: 'সতর্কতা', kha: 'সতর্কতা',
    grt: 'সতর্কতা', lus: 'Alert', mni: 'এলার্ট', mr: 'अलर्ट'
  },
  'nav.reports': {
    en: 'Reports', hi: 'रिपोर्ट', as: 'প্ৰতিবেদন', bn: 'রিপোর্ট', kha: 'রিপোর্ট',
    grt: 'রিপোর্ট', lus: 'Report', mni: 'রিপোর্ট', mr: 'अहवाल'
  },
  'nav.about': {
    en: 'About', hi: 'के बारे में', as: 'বিষয়ে', bn: 'সম্পর্কে', kha: 'কা জিংই',
    grt: 'গিসিক', lus: 'Chungchang', mni: 'মতাং', mr: 'बद्दल'
  },
  'nav.contact': {
    en: 'Contact', hi: 'संपर्क', as: 'যোগাযোগ', bn: 'যোগাযোগ', kha: 'জোগাযোগ',
    grt: 'জোগাজোগ', lus: 'Biak', mni: 'যোগাযোগ', mr: 'संपर्क'
  },
  
  // Actions
  'action.login': {
    en: 'Login', hi: 'लॉगिन', as: 'লগইন', bn: 'লগইন', kha: 'লগইন',
    grt: 'লগইন', lus: 'Login', mni: 'লগইন', mr: 'लॉगिन'
  },
  'action.logout': {
    en: 'Logout', hi: 'लॉगआउट', as: 'লগআউট', bn: 'লগআউট', kha: 'লগআউট',
    grt: 'লগআউট', lus: 'Logout', mni: 'লগআউট', mr: 'लॉगआउट'
  },
  'action.register': {
    en: 'Get Started', hi: 'शुरू करें', as: 'আৰম্ভ কৰক', bn: 'শুরু করুন', kha: 'হা শুৰু',
    grt: 'শুৰু কৰক', lus: 'Tan la', mni: 'হৌগদবনি', mr: 'सुरू करा'
  },
  'action.save': {
    en: 'Save', hi: 'सेव करें', as: 'সংৰক্ষণ', bn: 'সংরক্ষণ', kha: 'সংৰক্ষণ',
    grt: 'সংৰক্ষণ', lus: 'Dahkhawm', mni: 'শেম্বা', mr: 'जतन करा'
  },
  'action.cancel': {
    en: 'Cancel', hi: 'रद्द करें', as: 'বাতিল', bn: 'বাতিল', kha: 'বাতিল',
    grt: 'বাতিল', lus: 'Cancel', mni: 'থেংনবা', mr: 'रद्द करा'
  },
  'action.submit': {
    en: 'Submit', hi: 'जमा करें', as: 'দাখিল', bn: 'জমা দিন', kha: 'দাখিল',
    grt: 'জমা', lus: 'Submit', mni: 'থাদোকউ', mr: 'सबमिट करा'
  },
  'action.search': {
    en: 'Search', hi: 'खोजें', as: 'সন্ধান', bn: 'অনুসন্ধান', kha: 'সন্ধান',
    grt: 'সন্ধান', lus: 'Zawng', mni: 'থীবা', mr: 'शोधा'
  },

  // Common
  'common.loading': {
    en: 'Loading...', hi: 'लोड हो रहा है...', as: 'লোড হৈ আছে...', bn: 'লোড হচ্ছে...', kha: 'লোড হৈ আছে...',
    grt: 'লোড হৈ আছে...', lus: 'Loading...', mni: 'লোদ তৌরি...', mr: 'लोड होत आहे...'
  },
  'common.error': {
    en: 'An error occurred', hi: 'एक त्रुटि हुई', as: 'এটা ত্ৰুটি হ\'ল', bn: 'একটি ত্রুটি হয়েছে', kha: 'এটা ত্ৰুটি হ\'ল',
    grt: 'এটা ত্ৰুটি হ\'ল', lus: 'Error a awm', mni: 'অশোইবা অমা থোকখ্রে', mr: 'त्रुटी आली'
  },
  'common.success': {
    en: 'Success', hi: 'सफलता', as: 'সফলতা', bn: 'সফল', kha: 'সফলতা',
    grt: 'সফলতা', lus: 'Hlawhtling', mni: 'ফজবা', mr: 'यशस्वी'
  },

  // Theme
  'theme.light': {
    en: 'Light Mode', hi: 'लाइट मोड', as: 'লাইট মোড', bn: 'হালকা মোড', kha: 'লাইট মোড',
    grt: 'লাইট মোড', lus: 'Light Mode', mni: 'মংগল মোড', mr: 'लाइट मोड'
  },
  'theme.dark': {
    en: 'Dark Mode', hi: 'डार्क मोड', as: 'ডাৰ্ক মোড', bn: 'অন্ধকার মোড', kha: 'ডাৰ্ক মোড',
    grt: 'ডাৰ্ক মোড', lus: 'Dark Mode', mni: 'আমিবা মোড', mr: 'डार्क मोड'
  },

  // Language selector
  'language.select': {
    en: 'Select Language', hi: 'भाषा चुनें', as: 'ভাষা বাছক', bn: 'ভাষা নির্বাচন করুন', kha: 'কা কতিয়েন বা নং রিং',
    grt: 'কু কাতা দিলানি', lus: 'Ṭawng thlan', mni: 'লোল খনবা', mr: 'भाषा निवडा'
  },

  // Health related
  'health.reportCase': {
    en: 'Report New Case', hi: 'नया मामला रिपोर्ट करें', as: 'নতুন ঘটনা ৰিপোৰ্ট কৰক', bn: 'নতুন কেস রিপোর্ট করুন', 
    kha: 'নতুন ঘটনা ৰিপোৰ্ট কৰক', grt: 'নতুন ঘটনা ৰিপোৰ্ট কৰক', lus: 'Case thar report rawh', mni: 'অনৌবা কেস রিপোর্ট', mr: 'नवीन केस नोंदवा'
  },
  'health.symptoms': {
    en: 'Symptoms', hi: 'लक्षण', as: 'লক্ষণ', bn: 'লক্ষণ', kha: 'লক্ষণ',
    grt: 'লক্ষণ', lus: 'Vei chian', mni: 'খুদোংচাদবা', mr: 'लक्षणे'
  },

  // Water quality
  'water.quality': {
    en: 'Water Quality', hi: 'जल गुणवत्ता', as: 'পানীৰ গুণগত মান', bn: 'জলের গুণমান', kha: 'পানীৰ গুণগত মান',
    grt: 'পানীৰ গুণগত মান', lus: 'Tui ṭhatna', mni: 'ঈশিংগী কোয়ালিটি', mr: 'पाण्याची गुणवत्ता'
  },
  'water.safe': {
    en: 'Safe', hi: 'सुरक्षित', as: 'সুৰক্ষিত', bn: 'নিরাপদ', kha: 'সুৰক্ষিত',
    grt: 'সুৰক্ষিত', lus: 'Him', mni: 'শাফবা', mr: 'सुरक्षित'
  },
  'water.contaminated': {
    en: 'Contaminated', hi: 'दूषित', as: 'দূষিত', bn: 'দূষিত', kha: 'দূষিত',
    grt: 'দূষিত', lus: 'A bawlhhlawh', mni: 'মাইওনবা', mr: 'दूषित'
  },
};

interface TranslationContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  /** Get static translation by key */
  t: (key: string, fallback?: string) => string;
  /** Translate dynamic text via API (cached) */
  translate: (text: string, isHtml?: boolean) => Promise<string>;
  /** Bulk translate multiple texts */
  translateBulk: (texts: string[], isHtml?: boolean) => Promise<Map<string, string>>;
  /** Translate HTML content */
  translateHtml: (html: string) => Promise<string>;
  /** Check if currently translating */
  isTranslating: boolean;
  /** Available languages */
  languages: Language[];
  /** Cache statistics */
  cacheStats: { total: number; byLanguage: Record<string, number> } | null;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ total: number; byLanguage: Record<string, number> } | null>(null);
  
  // Batch translation queue
  const translationQueue = useRef<Map<string, { resolve: (value: string) => void; reject: (error: any) => void }[]>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('nirogya-language');
    if (savedLanguage) {
      const found = languages.find(lang => lang.code === savedLanguage);
      if (found) {
        setCurrentLanguage(found);
      }
    }

    // Load cache stats
    translationService.getCacheStats().then(setCacheStats);

    // Clear expired cache on mount
    translationService.clearExpiredCache();
  }, []);

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      translationService.getCacheStats().then(setCacheStats);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('nirogya-language', language.code);
    
    // Trigger a custom event for components that need to re-translate
    window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
  }, []);

  // Get static translation by key
  const t = useCallback((key: string, fallback?: string): string => {
    const translation = staticTranslations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return fallback || key;
    }
    
    return translation[currentLanguage.code] || translation['en'] || fallback || key;
  }, [currentLanguage.code]);

  // Process batched translations
  const processBatch = useCallback(async () => {
    const queue = translationQueue.current;
    if (queue.size === 0) return;

    const textsToTranslate = Array.from(queue.keys());
    const callbacks = new Map(queue);
    queue.clear();

    setIsTranslating(true);

    try {
      const result = await translationService.translateBulk({
        texts: textsToTranslate,
        sourceLang: 'en',
        targetLang: currentLanguage.code,
      });

      callbacks.forEach((callbackList, text) => {
        const translated = result.translations.get(text) || text;
        callbackList.forEach(({ resolve }) => resolve(translated));
      });
    } catch (error) {
      callbacks.forEach((callbackList, text) => {
        callbackList.forEach(({ resolve }) => resolve(text)); // Return original on error
      });
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage.code]);

  // Translate dynamic text (batched)
  const translate = useCallback((text: string, isHtml: boolean = false): Promise<string> => {
    if (!text || currentLanguage.code === 'en') {
      return Promise.resolve(text);
    }

    return new Promise((resolve, reject) => {
      const queue = translationQueue.current;
      
      if (!queue.has(text)) {
        queue.set(text, []);
      }
      queue.get(text)!.push({ resolve, reject });

      // Debounce batch processing
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      batchTimeoutRef.current = setTimeout(processBatch, 50);
    });
  }, [currentLanguage.code, processBatch]);

  // Bulk translate multiple texts
  const translateBulk = useCallback(async (texts: string[], isHtml: boolean = false): Promise<Map<string, string>> => {
    if (texts.length === 0 || currentLanguage.code === 'en') {
      return new Map(texts.map(t => [t, t]));
    }

    setIsTranslating(true);
    try {
      const result = await translationService.translateBulk({
        texts,
        sourceLang: 'en',
        targetLang: currentLanguage.code,
        isHtml,
      });
      return result.translations;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage.code]);

  // Translate HTML content
  const translateHtml = useCallback(async (html: string): Promise<string> => {
    if (!html || currentLanguage.code === 'en') {
      return html;
    }

    setIsTranslating(true);
    try {
      return await translationService.translateHtml(html, 'en', currentLanguage.code);
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage.code]);

  const contextValue = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t,
    translate,
    translateBulk,
    translateHtml,
    isTranslating,
    languages,
    cacheStats,
  }), [currentLanguage, setLanguage, t, translate, translateBulk, translateHtml, isTranslating, cacheStats]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Convenience hook for language only
export const useLanguage = () => {
  const { currentLanguage, setLanguage, languages } = useTranslation();
  return { currentLanguage, setLanguage, languages };
};

export default TranslationProvider;
