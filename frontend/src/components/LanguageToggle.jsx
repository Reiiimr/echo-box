import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const setLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('echobox-lang', lang);
  };

  return (
    <div className="lang-toggle">
      <button
        className={'lang-btn' + (i18n.language === 'en' ? ' active' : '')}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        className={'lang-btn' + (i18n.language === 'tl' ? ' active' : '')}
        onClick={() => setLang('tl')}
      >
        TL
      </button>
    </div>
  );
}
