import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { lang, setLang } = useApp();

  return (
    <footer className="bg-[#0F2C26] text-[#CFE0D9] mt-auto">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-brand-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">G</span>
              </div>
              <span className="text-white font-bold text-xl">GuraAha</span>
            </div>
            <p className="text-sm text-[#8FAF9F] leading-relaxed mb-5">
              Rwanda's trusted platform connecting buyers with verified land and house listings. Safe, transparent, local.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://wa.me/250788747764" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1E4038] flex items-center justify-center hover:bg-brand-green transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a href="https://facebook.com/guraaha" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1E4038] flex items-center justify-center hover:bg-brand-green transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/guraaha" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1E4038] flex items-center justify-center hover:bg-brand-green transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/guraaha" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1E4038] flex items-center justify-center hover:bg-brand-green transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Explore links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Explore</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/browse', label: 'Browse listings' },
                { to: '/become-blocker', label: 'Become a Blocker' },
                { to: '/partners', label: 'Certified Partners' },
                { to: '/membership', label: 'Membership plans' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-[#8FAF9F] hover:text-white transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Contact us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#8FAF9F] mb-0.5">Phone / WhatsApp</p>
                  <a href="tel:+250788747764" className="text-sm text-white hover:text-brand-green transition-colors font-medium">
                    +250 788 747 764
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#8FAF9F] mb-0.5">Email</p>
                  <a href="mailto:info@guraaha.com" className="text-sm text-white hover:text-brand-green transition-colors font-medium">
                    info@guraaha.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#8FAF9F] mb-0.5">Location</p>
                  <p className="text-sm text-white font-medium">Kigali, Rwanda 🇷🇼</p>
                </div>
              </li>
            </ul>

            {/* Language switcher */}
            <div className="mt-6 flex items-center gap-2">
              <span className="text-xs text-[#8FAF9F]">Lang:</span>
              {['rw', 'en', 'fr'].map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${lang === l ? 'bg-brand-green text-white' : 'text-[#8FAF9F] hover:text-white'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#1E4038] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8FAF9F]">
            © {new Date().getFullYear()} GuraAha · All listings in Rwanda · Prices in RWF 🇷🇼
          </p>
          <p className="text-xs text-[#8FAF9F]">Built for Rwandan families</p>
        </div>
      </div>
    </footer>
  );
};
