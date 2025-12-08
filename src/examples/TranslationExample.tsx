// src/examples/TranslationExample.tsx
// Example demonstrating the optimized translation system

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslatedText, useTranslatedText, useTranslatedTexts } from '../components/TranslatedText';
import LanguageSelector from '../components/LanguageSelector';

/**
 * Example component demonstrating all translation features
 */
const TranslationExample: React.FC = () => {
  const { t, translate, translateBulk, translateHtml, isTranslating, currentLanguage } = useLanguage();
  
  // Example: Translate a single dynamic text
  const [dynamicText, setDynamicText] = useState('');
  
  // Example: Using the hook for automatic translation
  const translatedGreeting = useTranslatedText('Welcome to our health surveillance system');
  
  // Example: Bulk translation of multiple texts
  const textsToTranslate = [
    'Report a new case',
    'View water quality data',
    'Check disease hotspots',
    'Emergency contacts',
  ];
  const bulkTranslations = useTranslatedTexts(textsToTranslate);
  
  // Example: HTML translation
  const [translatedHtml, setTranslatedHtml] = useState('');
  const htmlContent = `
    <h2>Health Advisory</h2>
    <p>Please <strong>boil water</strong> before drinking.</p>
    <ul>
      <li>Wash hands frequently</li>
      <li>Report symptoms early</li>
    </ul>
  `;

  useEffect(() => {
    // Translate dynamic text
    translate('This text is translated dynamically').then(setDynamicText);
    
    // Translate HTML content
    translateHtml(htmlContent).then(setTranslatedHtml);
  }, [currentLanguage.code, translate, translateHtml, htmlContent]);

  return (
    <div className="translation-example">
      <h1>{t('nav.dashboard')}</h1>
      
      {/* Language Selector */}
      <section>
        <h3>Language Selection</h3>
        <LanguageSelector variant="dropdown" showNative showFlags />
        <p>Current: {currentLanguage.name} ({currentLanguage.nativeName})</p>
      </section>

      {/* Static Translations */}
      <section>
        <h3>Static Translations (pre-defined keys)</h3>
        <ul>
          <li>Home: {t('nav.home')}</li>
          <li>Dashboard: {t('nav.dashboard')}</li>
          <li>Login: {t('action.login')}</li>
          <li>Loading: {t('common.loading')}</li>
        </ul>
      </section>

      {/* TranslatedText Component */}
      <section>
        <h3>TranslatedText Component</h3>
        {/* Using translation key */}
        <TranslatedText tKey="nav.map" as="p">Map</TranslatedText>
        
        {/* Dynamic translation */}
        <TranslatedText as="p">
          This paragraph will be translated automatically via API
        </TranslatedText>
      </section>

      {/* Hook-based Translation */}
      <section>
        <h3>Hook-based Translation</h3>
        <p>{translatedGreeting}</p>
        <p>{dynamicText}</p>
      </section>

      {/* Bulk Translation */}
      <section>
        <h3>Bulk Translation (efficient batch API call)</h3>
        <ul>
          {textsToTranslate.map((text, index) => (
            <li key={index}>
              {text} → {bulkTranslations.get(text) || text}
            </li>
          ))}
        </ul>
      </section>

      {/* HTML Translation */}
      <section>
        <h3>HTML Translation (preserves tags)</h3>
        <div 
          className="translated-html"
          dangerouslySetInnerHTML={{ __html: translatedHtml || htmlContent }}
        />
      </section>

      {/* Translation Status */}
      {isTranslating && (
        <div className="translation-status">
          Translating...
        </div>
      )}

      <style>{`
        .translation-example {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        section {
          margin: 20px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        
        h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 8px;
        }
        
        .translated-html {
          background: white;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .translation-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border-radius: 4px;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default TranslationExample;

/**
 * Example: How to use translation in any component
 * 
 * 1. Import the hook:
 *    import { useLanguage } from '../contexts/LanguageContext';
 * 
 * 2. Use in component:
 *    const { t, translate, currentLanguage } = useLanguage();
 * 
 * 3. Static translation (fast, no API call):
 *    <h1>{t('nav.dashboard')}</h1>
 * 
 * 4. Dynamic translation (uses API with caching):
 *    const [text, setText] = useState('');
 *    useEffect(() => {
 *      translate('Some dynamic text').then(setText);
 *    }, [currentLanguage.code]);
 * 
 * 5. Bulk translation (efficient for multiple texts):
 *    const translations = await translateBulk(['text1', 'text2', 'text3']);
 * 
 * 6. HTML translation (preserves HTML tags):
 *    const translatedHtml = await translateHtml('<p>Hello <strong>world</strong></p>');
 */
