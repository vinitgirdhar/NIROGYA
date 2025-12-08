// src/components/TranslatedText.tsx
// Component for automatically translating text content

import React, { useState, useEffect, memo, ElementType } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Re-export for convenience
export { useLanguage } from '../contexts/LanguageContext';

interface TranslatedTextProps {
  /** The text to translate */
  children: string;
  /** Translation key for static translations (takes priority) */
  tKey?: string;
  /** Whether the content is HTML */
  isHtml?: boolean;
  /** Fallback text if translation fails */
  fallback?: string;
  /** Custom className */
  className?: string;
  /** HTML tag to render */
  as?: ElementType;
  /** Show loading indicator */
  showLoading?: boolean;
}

/**
 * Component that automatically translates its text content
 * Uses static translations if tKey is provided, otherwise uses API translation
 */
export const TranslatedText: React.FC<TranslatedTextProps> = memo(({
  children,
  tKey,
  isHtml = false,
  fallback,
  className,
  as: Component = 'span' as ElementType,
  showLoading = false,
}) => {
  const { t, translate, translateHtml, currentLanguage, isTranslating } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>(children);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If a translation key is provided, use static translation
    if (tKey) {
      setTranslatedText(t(tKey) || fallback || children);
      return;
    }

    // Skip translation for English
    if (currentLanguage.code === 'en') {
      setTranslatedText(children);
      return;
    }

    // Dynamic translation
    const doTranslate = async () => {
      setIsLoading(true);
      try {
        const result = isHtml 
          ? await translateHtml(children)
          : await translate(children);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(fallback || children);
      } finally {
        setIsLoading(false);
      }
    };

    doTranslate();
  }, [children, tKey, currentLanguage.code, isHtml, t, translate, translateHtml, fallback]);

  if (showLoading && (isLoading || isTranslating)) {
    return (
      <Component className={className}>
        <span className="translation-loading">{children}</span>
      </Component>
    );
  }

  if (isHtml) {
    return (
      <Component 
        className={className}
        dangerouslySetInnerHTML={{ __html: translatedText }}
      />
    );
  }

  return <Component className={className}>{translatedText}</Component>;
});

TranslatedText.displayName = 'TranslatedText';

/**
 * Higher-order component for translating component props
 */
export function withTranslation<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  propsToTranslate: (keyof P)[]
) {
  return function TranslatedComponent(props: P) {
    const { translate, currentLanguage } = useLanguage();
    const [translatedProps, setTranslatedProps] = useState<Partial<P>>({});

    useEffect(() => {
      if (currentLanguage.code === 'en') {
        setTranslatedProps({});
        return;
      }

      const translateProps = async () => {
        const newProps: Partial<P> = {};
        
        await Promise.all(
          propsToTranslate.map(async (propName) => {
            const value = props[propName];
            if (typeof value === 'string' && value.trim()) {
              (newProps as any)[propName] = await translate(value);
            }
          })
        );

        setTranslatedProps(newProps);
      };

      translateProps();
    }, [props, currentLanguage.code, translate]);

    return <WrappedComponent {...props} {...translatedProps} />;
  };
}

/**
 * Hook for translating a single text value with caching
 */
export function useTranslatedText(text: string, isHtml: boolean = false): string {
  const { translate, translateHtml, currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (currentLanguage.code === 'en' || !text) {
      setTranslatedText(text);
      return;
    }

    const doTranslate = async () => {
      try {
        const result = isHtml 
          ? await translateHtml(text)
          : await translate(text);
        setTranslatedText(result);
      } catch {
        setTranslatedText(text);
      }
    };

    doTranslate();
  }, [text, currentLanguage.code, isHtml, translate, translateHtml]);

  return translatedText;
}

/**
 * Hook for translating multiple texts at once
 */
export function useTranslatedTexts(texts: string[]): Map<string, string> {
  const { translateBulk, currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Map<string, string>>(
    new Map(texts.map(t => [t, t]))
  );

  useEffect(() => {
    if (currentLanguage.code === 'en' || texts.length === 0) {
      setTranslations(new Map(texts.map(t => [t, t])));
      return;
    }

    const doTranslate = async () => {
      try {
        const result = await translateBulk(texts);
        setTranslations(result);
      } catch {
        setTranslations(new Map(texts.map(t => [t, t])));
      }
    };

    doTranslate();
  }, [texts.join('|'), currentLanguage.code, translateBulk]);

  return translations;
}

export default TranslatedText;