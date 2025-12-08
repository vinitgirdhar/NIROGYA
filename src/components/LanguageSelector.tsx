// src/components/LanguageSelector.tsx
// Language selector dropdown component with search and grouping

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation, languages, Language } from '../contexts/TranslationContext';

interface LanguageSelectorProps {
  /** Variant style */
  variant?: 'dropdown' | 'inline' | 'compact';
  /** Show native language names */
  showNative?: boolean;
  /** Show language flags */
  showFlags?: boolean;
  /** Show region info */
  showRegion?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when language changes */
  onChange?: (language: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showNative = true,
  showFlags = true,
  showRegion = false,
  className = '',
  onChange,
}) => {
  const { currentLanguage, setLanguage, t, cacheStats } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    
    const query = searchQuery.toLowerCase();
    return languages.filter(lang => 
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query) ||
      (lang.region && lang.region.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Group languages by region
  const groupedLanguages = useMemo(() => {
    const groups: Record<string, Language[]> = {};
    
    filteredLanguages.forEach(lang => {
      const region = lang.region || 'Other';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(lang);
    });

    return groups;
  }, [filteredLanguages]);

  const handleSelect = (language: Language) => {
    setLanguage(language);
    setIsOpen(false);
    setSearchQuery('');
    onChange?.(language);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Compact variant - just a flag/code
  if (variant === 'compact') {
    return (
      <div className={`language-selector-compact ${className}`} ref={dropdownRef}>
        <button
          className="language-selector-trigger-compact"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t('language.select')}
          title={currentLanguage.name}
        >
          {showFlags && <span className="lang-flag">{currentLanguage.flag}</span>}
          <span className="lang-code">{currentLanguage.code.toUpperCase()}</span>
        </button>
        
        {isOpen && (
          <div className="language-dropdown-compact">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`language-option-compact ${lang.code === currentLanguage.code ? 'active' : ''}`}
                onClick={() => handleSelect(lang)}
                title={lang.name}
              >
                {showFlags && <span className="lang-flag">{lang.flag}</span>}
                <span className="lang-code">{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Inline variant - horizontal list
  if (variant === 'inline') {
    return (
      <div className={`language-selector-inline ${className}`}>
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-option-inline ${lang.code === currentLanguage.code ? 'active' : ''}`}
            onClick={() => handleSelect(lang)}
            title={showNative ? lang.nativeName : lang.name}
          >
            {showFlags && <span className="lang-flag">{lang.flag}</span>}
            <span className="lang-name">{showNative ? lang.nativeName : lang.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`language-selector ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        className="language-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlags && <span className="lang-flag">{currentLanguage.flag}</span>}
        <span className="lang-name">
          {showNative ? currentLanguage.nativeName : currentLanguage.name}
        </span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
        >
          <path 
            d="M3 4.5L6 7.5L9 4.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown" role="listbox">
          {/* Search input */}
          <div className="language-search">
            <input
              type="text"
              placeholder={t('action.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Language list */}
          <div className="language-list">
            {showRegion ? (
              // Grouped by region
              Object.entries(groupedLanguages).map(([region, langs]) => (
                <div key={region} className="language-group">
                  <div className="language-group-header">{region}</div>
                  {langs.map(lang => (
                    <LanguageOption
                      key={lang.code}
                      language={lang}
                      isActive={lang.code === currentLanguage.code}
                      showFlags={showFlags}
                      showNative={showNative}
                      showRegion={false}
                      onClick={() => handleSelect(lang)}
                    />
                  ))}
                </div>
              ))
            ) : (
              // Flat list
              filteredLanguages.map(lang => (
                <LanguageOption
                  key={lang.code}
                  language={lang}
                  isActive={lang.code === currentLanguage.code}
                  showFlags={showFlags}
                  showNative={showNative}
                  showRegion={showRegion}
                  onClick={() => handleSelect(lang)}
                />
              ))
            )}

            {filteredLanguages.length === 0 && (
              <div className="language-no-results">
                No languages found
              </div>
            )}
          </div>

          {/* Cache stats footer */}
          {cacheStats && (
            <div className="language-cache-stats">
              <small>
                📦 {cacheStats.total} cached translations
              </small>
            </div>
          )}
        </div>
      )}

      <style>{`
        .language-selector {
          position: relative;
          display: inline-block;
        }

        .language-selector-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .language-selector-trigger:hover {
          background: var(--bg-hover, #e8e8e8);
          border-color: var(--border-hover, #bbb);
        }

        .lang-flag {
          font-size: 18px;
        }

        .dropdown-arrow {
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          min-width: 220px;
          max-height: 350px;
          margin-top: 4px;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .language-search {
          padding: 8px;
          border-bottom: 1px solid var(--border-color, #ddd);
        }

        .language-search input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }

        .language-search input:focus {
          border-color: var(--primary-color, #007bff);
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }

        .language-list {
          overflow-y: auto;
          max-height: 250px;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .language-option:hover {
          background: var(--bg-hover, #f0f0f0);
        }

        .language-option.active {
          background: var(--primary-light, #e3f2fd);
          color: var(--primary-color, #007bff);
        }

        .language-option .lang-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .language-option .lang-name {
          font-weight: 500;
        }

        .language-option .lang-native {
          font-size: 12px;
          opacity: 0.7;
        }

        .language-option .lang-region {
          font-size: 11px;
          opacity: 0.5;
        }

        .language-group-header {
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #666);
          background: var(--bg-secondary, #f9f9f9);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .language-no-results {
          padding: 20px;
          text-align: center;
          color: var(--text-secondary, #666);
        }

        .language-cache-stats {
          padding: 8px 12px;
          border-top: 1px solid var(--border-color, #ddd);
          background: var(--bg-secondary, #f9f9f9);
          text-align: center;
          color: var(--text-secondary, #666);
        }

        /* Compact variant */
        .language-selector-compact {
          position: relative;
        }

        .language-selector-trigger-compact {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: transparent;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .language-dropdown-compact {
          position: absolute;
          top: 100%;
          right: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-width: 200px;
        }

        .language-option-compact {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 8px;
          background: var(--bg-secondary, #f5f5f5);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .language-option-compact:hover {
          background: var(--bg-hover, #e8e8e8);
        }

        .language-option-compact.active {
          background: var(--primary-color, #007bff);
          color: white;
        }

        /* Inline variant */
        .language-selector-inline {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .language-option-inline {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border: 1px solid transparent;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .language-option-inline:hover {
          background: var(--bg-hover, #e8e8e8);
          border-color: var(--border-color, #ddd);
        }

        .language-option-inline.active {
          background: var(--primary-color, #007bff);
          color: white;
          border-color: var(--primary-color, #007bff);
        }
      `}</style>
    </div>
  );
};

// Individual language option component
interface LanguageOptionProps {
  language: Language;
  isActive: boolean;
  showFlags: boolean;
  showNative: boolean;
  showRegion: boolean;
  onClick: () => void;
}

const LanguageOption: React.FC<LanguageOptionProps> = ({
  language,
  isActive,
  showFlags,
  showNative,
  showRegion,
  onClick,
}) => (
  <div
    className={`language-option ${isActive ? 'active' : ''}`}
    onClick={onClick}
    role="option"
    aria-selected={isActive}
  >
    {showFlags && <span className="lang-flag">{language.flag}</span>}
    <div className="lang-details">
      <span className="lang-name">{language.name}</span>
      {showNative && language.nativeName !== language.name && (
        <span className="lang-native">{language.nativeName}</span>
      )}
      {showRegion && language.region && (
        <span className="lang-region">{language.region}</span>
      )}
    </div>
    {isActive && (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
      </svg>
    )}
  </div>
);

export default LanguageSelector;
