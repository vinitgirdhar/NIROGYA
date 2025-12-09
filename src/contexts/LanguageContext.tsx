import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import translationService from '../services/translationService';
import type { SupportedLanguageCode } from '../services/translationService';

// Language definitions for Northeast India and other major languages
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const languages: Language[] = [
  // English and Hindi
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'International' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  
  // Northeast Indian Languages
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🏔️', region: 'Assam' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🌾', region: 'West Bengal/Tripura' },
  { code: 'bpy', name: 'Bishnupriya', nativeName: 'বিষ্ণুপ্রিয়া মণিপুরী', flag: '🏞️', region: 'Manipur' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🏔️', region: 'Manipur' },
  { code: 'kha', name: 'Khasi', nativeName: 'কা খাসি', flag: '⛰️', region: 'Meghalaya' },
  { code: 'grt', name: 'Garo', nativeName: 'আ•চিক কাতা', flag: '🌲', region: 'Meghalaya' },
  { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', flag: '🌿', region: 'Mizoram' },
  { code: 'nag', name: 'Nagamese', nativeName: 'নাগামিজ', flag: '🏞️', region: 'Nagaland' },
  { code: 'sck', name: 'Sadri', nativeName: 'सादरी', flag: '🌱', region: 'Jharkhand/Assam' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད་', flag: '🏔️', region: 'Sikkim/Arunachal' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', region: 'Sikkim/Darjeeling' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ', flag: '🏔️', region: 'Bhutan border areas' },
  
  // Additional Indian Languages
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌾', region: 'Andhra Pradesh' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🌴', region: 'Tamil Nadu' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌺', region: 'Karnataka' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🥥', region: 'Kerala' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🦚', region: 'Gujarat' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🏛️', region: 'Maharashtra' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🌾', region: 'Punjab' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🏛️', region: 'Odisha' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🌙', region: 'Urdu speaking regions' },
  
  // International Languages
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', region: 'China border areas' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲', region: 'Myanmar border' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'Thailand' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Vietnam' }
];

// Translation keys and content
export interface Translations {
  [key: string]: {
    [langCode: string]: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.home': {
    en: 'Home',
    hi: 'होम',
    as: 'ঘৰ',
    bn: 'হোম',
    mni: 'য়ুম',
    kha: 'কা জিংইয়াহ',
    grt: 'দাক গিমিক',
    lus: 'In',
    ne: 'घर',
    bo: 'ཁྱིམ',
    te: 'హోమ్',
    ta: 'முகப்பு',
    zh: '首页',
    my: 'အိမ်'
  },
  'nav.dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    as: 'ডেছবৰ্ড',
    bn: 'ড্যাশবোর্ড',
    mni: 'ডেশবোর্ড',
    kha: 'ডেশবোর্ড',
    grt: 'ডেশবোর্ড',
    lus: 'Dashboard',
    ne: 'ड्यासबोर्ड',
    bo: 'ལས་འགན',
    te: 'డాష్‌బోర్డ్',
    ta: 'டாஷ்போர்டு',
    zh: '仪表板',
    my: 'ဒက်ရှ်ဘုတ်'
  },
  'nav.map': {
    en: 'Map',
    hi: 'नक्शा',
    as: 'মানচিত্ৰ',
    bn: 'মানচিত্র',
    mni: 'মেপ',
    kha: 'কা মানচিত্র',
    grt: 'নাক্সা',
    lus: 'Map',
    ne: 'नक्सा',
    bo: 'ས་བཀྲ',
    te: 'మ్యాప్',
    ta: 'வரைபடம்',
    zh: '地图',
    my: 'မြေပုံ'
  },
  'nav.gallery': {
    en: 'Gallery',
    hi: 'गैलरी',
    as: 'গেলাৰী',
    bn: 'গ্যালারি',
    mni: 'গেলারি',
    kha: 'গেলারি',
    grt: 'গেলারি',
    lus: 'Gallery',
    ne: 'ग्यालरी',
    bo: 'པར་ཁང',
    te: 'గ్యాలరీ',
    ta: 'படக்காட்சி',
    zh: '画廊',
    my: 'ပြခန်း'
  },
  'nav.news': {
    en: 'News',
    hi: 'समाचार',
    as: 'বাতৰি',
    bn: 'সংবাদ',
    mni: 'পাউজেল',
    kha: 'কা খবর',
    grt: 'খবৰ',
    lus: 'Thuthlung',
    ne: 'समाचार',
    bo: 'གསར་འགྱུར',
    te: 'వార్తలు',
    ta: 'செய்திகள்',
    zh: '新闻',
    my: 'သတင်း'
  },
  'nav.about': {
    en: 'About',
    hi: 'के बारे में',
    as: 'বিষয়ে',
    bn: 'সম্পর্কে',
    mni: 'মতাং',
    kha: 'কা জিংই',
    grt: 'গিসিক',
    lus: 'Chungchang',
    ne: 'बारेमा',
    bo: 'སྐོར',
    te: 'గురించి',
    ta: 'பற்றி',
    zh: '关于',
    my: 'အကြောင်း'
  },
  'nav.contact': {
    en: 'Contact',
    hi: 'संपर्क',
    as: 'যোগাযোগ',
    bn: 'যোগাযোগ',
    mni: 'যোগাযোগ',
    kha: 'জোগাযোগ',
    grt: 'জোগাজোগ',
    lus: 'Biak',
    ne: 'सम्पर्क',
    bo: 'འབྲེལ་བ',
    te: 'సంప్రదించండి',
    ta: 'தொடர்பு',
    zh: '联系',
    my: 'ဆက်သွယ်'
  },
  
  // Common actions
  'action.login': {
    en: 'Login',
    hi: 'लॉगिन',
    as: 'লগইন',
    bn: 'লগইন',
    mni: 'লগইন',
    kha: 'লগইন',
    grt: 'লগইন',
    lus: 'Login',
    ne: 'लगइन',
    bo: 'ནང་འཇུག',
    te: 'లాగిన్',
    ta: 'உள்நுழைவு',
    zh: '登录',
    my: 'လော့ဂ်အင်'
  },
  'action.register': {
    en: 'Get Started',
    hi: 'शुरू करें',
    as: 'আৰম্ভ কৰক',
    bn: 'শুরু করুন',
    mni: 'হৌগদবনি',
    kha: 'হা শুৰু',
    grt: 'শুৰু কৰক',
    lus: 'Tan la',
    ne: 'सुरु गर्नुहोस्',
    bo: 'འགོ་བཙུགས',
    te: 'ప్రారంభించండి',
    ta: 'தொடங்குங்கள்',
    zh: '开始',
    my: 'စတင်ပါ'
  },
  'action.logout': {
    en: 'Logout',
    hi: 'लॉगआउट',
    as: 'লগআউট',
    bn: 'লগআউট',
    mni: 'লগআউট',
    kha: 'লগআউট',
    grt: 'লগআউট',
    lus: 'Logout',
    ne: 'लगआउट',
    bo: 'ཕྱིར་འཐོན',
    te: 'లాగౌట్',
    ta: 'வெளியேறு',
    zh: '退出',
    my: 'လော့ဂ်အောက်'
  },
  'theme.light': {
    en: 'Light Mode',
    hi: 'लाइट मोड',
    as: 'লাইট মোড',
    bn: 'হালকা মোড',
    mni: 'মংগল মোড',
    kha: 'লাইট মোড',
    grt: 'লাইট মোড',
    lus: 'Light Mode',
    ne: 'उज्यालो मोड',
    bo: 'འོད་མདངས',
    te: 'లైట్ మోడ్',
    ta: 'ஒளி முறை',
    zh: '浅色模式',
    my: 'အလင်းမုဒ်'
  },
  'theme.dark': {
    en: 'Dark Mode',
    hi: 'डार्क मोड',
    as: 'ডাৰ্ক মোড',
    bn: 'অন্ধকার মোড',
    mni: 'আমিবা মোড',
    kha: 'ডাৰ্ক মোড',
    grt: 'ডাৰ্ক মোড',
    lus: 'Dark Mode',
    ne: 'अँध्यारो मोड',
    bo: 'མུན་པའི',
    te: 'డార్క్ మోడ్',
    ta: 'இருண்ட முறை',
    zh: '深色模式',
    my: 'အမှောင်မုဒ်'
  },
  'language.select': {
    en: 'Select Language',
    hi: 'भाषा चुनें',
    as: 'ভাষা বাছক',
    bn: 'ভাষা নির্বাচন করুন',
    mni: 'লোল খনবা',
    kha: 'কা কতিয়েন বা নং রিং',
    grt: 'কু কাতা দিলানি',
    lus: 'Ṭawng thlan',
    ne: 'भाषा छान्नुहोस्',
    bo: 'སྐད་ཡིག་འདེམས',
    te: 'భాష ఎంచుకోండి',
    ta: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    zh: '选择语言',
    my: 'ဘာသာစကားရွေးချယ်ပါ'
  },
  // Dashboard translations
  'dashboard.title': {
    en: 'Nirogya - Health Surveillance Dashboard',
    hi: 'निरोग्य - स्वास्थ्य निगरानी डैशबोर्ड',
    as: 'নিৰোগ্য - স্বাস্থ্য নিৰীক্ষণ ডেছবৰ্ড',
    bn: 'নিরোগ্য - স্বাস্থ্য নজরদারি ড্যাশবোর্ড',
    mr: 'निरोग्य - आरोग्य निगराणी डॅशबोर्ड'
  },
  'dashboard.totalCases': {
    en: 'Total Cases',
    hi: 'कुल मामले',
    as: 'মুঠ ঘটনা',
    bn: 'মোট কেস',
    mr: 'एकूण प्रकरणे'
  },
  'dashboard.activeCases': {
    en: 'Active Cases',
    hi: 'सक्रिय मामले',
    as: 'সক্ৰিয় ঘটনা',
    bn: 'সক্রিয় কেস',
    mr: 'सक्रिय प्रकरणे'
  },
  'dashboard.resolvedCases': {
    en: 'Resolved Cases',
    hi: 'हल किए गए मामले',
    as: 'সমাধান হোৱা ঘটনা',
    bn: 'সমাধান করা কেস',
    mr: 'निराकरण केलेली प्रकरणे'
  },
  'dashboard.contaminatedSources': {
    en: 'Contaminated Sources',
    hi: 'दूषित स्रोत',
    as: 'দূষিত উৎস',
    bn: 'দূষিত উৎস',
    mr: 'दूषित स्रोत'
  },
  // Navigation
  'nav.healthData': {
    en: 'Health Data',
    hi: 'स्वास्थ्य डेटा',
    as: 'স্বাস্থ্য তথ্য',
    bn: 'স্বাস্থ্য ডেটা',
    mr: 'आरोग्य डेटा'
  },
  'nav.waterQuality': {
    en: 'Water Quality',
    hi: 'जल गुणवत्ता',
    as: 'পানীৰ গুণগত মান',
    bn: 'জলের গুণমান',
    mr: 'पाण्याची गुणवत्ता'
  },
  'nav.alerts': {
    en: 'Alerts',
    hi: 'अलर्ट',
    as: 'সতৰ্কতা',
    bn: 'সতর্কতা',
    mr: 'अलर्ट'
  },
  'nav.community': {
    en: 'Community',
    hi: 'समुदाय',
    as: 'সম্প্ৰদায়',
    bn: 'সম্প্রদায়',
    mr: 'समुदाय'
  },
  'nav.education': {
    en: 'Education',
    hi: 'शिक्षा',
    as: 'শিক্ষা',
    bn: 'শিক্ষা',
    mr: 'शिक्षण'
  },
  'nav.reports': {
    en: 'Reports',
    hi: 'रिपोर्ट',
    as: 'প্ৰতিবেদন',
    bn: 'রিপোর্ট',
    mr: 'अहवाल'
  }
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  /** Get static translation by key */
  t: (key: string) => string;
  /** Translate dynamic text via API (with caching) */
  translate: (text: string, isHtml?: boolean) => Promise<string>;
  /** Bulk translate multiple texts */
  translateBulk: (texts: string[], isHtml?: boolean) => Promise<Map<string, string>>;
  /** Translate HTML content */
  translateHtml: (html: string) => Promise<string>;
  /** Check if currently translating */
  isTranslating: boolean;
  /** Available languages */
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]); // Default to English
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Batch translation queue for efficient API calls
  const translationQueue = useRef<Map<string, { resolve: (value: string) => void; reject: (error: any) => void }[]>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('paani-care-language');
    if (savedLanguage) {
      const found = languages.find(lang => lang.code === savedLanguage);
      if (found) {
        setCurrentLanguage(found);
      }
    }
    
    // Clear expired cache on mount
    translationService.clearExpiredCache();
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('paani-care-language', language.code);
    // Dispatch event for components that need to re-translate
    window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
  }, []);

  // Static translation function (uses predefined translations)
  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      // Extract a human-readable fallback from the key
      // e.g., "governmentReports.title" -> "Title", "nav.dashboard" -> "Dashboard"
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1];
      // Convert camelCase to Title Case with spaces
      const readable = lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      return readable;
    }
    
    return translation[currentLanguage.code] || translation['en'] || key;
  }, [currentLanguage.code]);

  // Process batched translations efficiently
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
        targetLang: currentLanguage.code as SupportedLanguageCode,
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

  // Dynamic translation via API (batched & cached)
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

      // Debounce batch processing (50ms)
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      batchTimeoutRef.current = setTimeout(processBatch, 50);
    });
  }, [currentLanguage.code, processBatch]);

  // Bulk translate multiple texts at once
  const translateBulk = useCallback(async (texts: string[], isHtml: boolean = false): Promise<Map<string, string>> => {
    if (texts.length === 0 || currentLanguage.code === 'en') {
      return new Map(texts.map(t => [t, t]));
    }

    setIsTranslating(true);
    try {
      const result = await translationService.translateBulk({
        texts,
        sourceLang: 'en',
        targetLang: currentLanguage.code as SupportedLanguageCode,
        isHtml,
      });
      return result.translations;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage.code]);

  // Translate HTML content while preserving tags
  const translateHtml = useCallback(async (html: string): Promise<string> => {
    if (!html || currentLanguage.code === 'en') {
      return html;
    }

    setIsTranslating(true);
    try {
      return await translationService.translateHtml(html, 'en', currentLanguage.code as SupportedLanguageCode);
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
  }), [currentLanguage, setLanguage, t, translate, translateBulk, translateHtml, isTranslating]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider;