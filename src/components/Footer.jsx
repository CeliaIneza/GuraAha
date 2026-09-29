import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { lang, setLang } = useApp();

  return (
    <footer className="bg-brand-bg-soft border-t border-brand-line py-8 mt-16 text-sm text-brand-ink-soft">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <span className="font-semibold text-brand-ink">© 2026 GuraAha</span> — Land &amp; homes across Rwanda
        </div>
        <div className="flex items-center gap-3">
          <span>Prototype v2</span>
          <span>•</span>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('rw')}
              className={`hover:underline ${lang === 'rw' ? 'font-bold text-brand-green' : ''}`}
            >
              RW
            </button>
            <span>/</span>
            <button
              onClick={() => setLang('en')}
              className={`hover:underline ${lang === 'en' ? 'font-bold text-brand-green' : ''}`}
            >
              EN
            </button>
            <span>/</span>
            <button
              onClick={() => setLang('fr')}
              className={`hover:underline ${lang === 'fr' ? 'font-bold text-brand-green' : ''}`}
            >
              FR
            </button>
          </div>
          <span>•</span>
          <span>Rwanda today, East Africa next</span>
        </div>
      </div>
    </footer>
  );
};
