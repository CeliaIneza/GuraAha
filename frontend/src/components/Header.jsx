import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, LogIn } from 'lucide-react';

export const Header = () => {
  const { lang, setLang, t } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-line shadow-sm px-4 sm:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
      <Link to="/" className="flex items-center gap-2.5 text-brand-ink no-underline group">
        <svg className="h-10 sm:h-12 w-auto transition-transform group-hover:scale-105" viewBox="60 0 400 460" xmlns="http://www.w3.org/2000/svg">
          <path d="M 224 137 A 150 150 0 1 0 276 136" fill="none" stroke="#BDA472" strokeWidth="24" strokeLinecap="round"/>
          <path d="M 224 137 C 180 95, 205 58, 298 50" fill="none" stroke="#007A66" strokeWidth="18" strokeLinecap="round"/>
          <path d="M 292 52 C 330 18, 410 22, 442 62 C 410 96, 330 92, 292 52 Z" fill="#007A66"/>
          <path d="M 208 78 C 178 44, 190 12, 232 4 C 244 40, 236 66, 208 78 Z" fill="#007A66"/>
          <path d="M 176 112 C 132 100, 112 70, 124 34 C 166 46, 184 78, 176 112 Z" fill="#007A66"/>
          <path d="M 262 118 C 244 146, 250 172, 276 184 C 290 156, 284 132, 262 118 Z" fill="#D3B42B"/>
          <path d="M 100 342 L 260 212 L 420 342" fill="none" stroke="#007A66" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/>
          <g fill="#D3B42B">
            <rect x="226" y="288" width="31" height="31" rx="3"/>
            <rect x="265" y="288" width="31" height="31" rx="3"/>
            <rect x="226" y="327" width="31" height="31" rx="3"/>
            <rect x="265" y="327" width="31" height="31" rx="3"/>
          </g>
        </svg>
        <span className="text-2xl font-bold tracking-tight text-brand-ink">guraaha</span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
        {[
          ['/', t('nav_home')],
          ['/browse', t('nav_browse')],
          ['/membership', t('nav_membership')],
          ['/partners', t('nav_partners')],
          ['/become-blocker', t('nav_blocker')],
        ].map(([path, label]) => (
          <Link
            key={path}
            to={path}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive(path) ? 'bg-brand-green text-white font-semibold' : 'text-brand-ink-soft hover:bg-brand-bg-soft hover:text-brand-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-2.5 py-1.5 border border-brand-line rounded-lg text-sm text-brand-ink bg-white focus:outline-none focus:border-brand-green"
        >
          <option value="rw">🇷🇼 Kinyarwanda</option>
          <option value="en">🇬🇧 English</option>
          <option value="fr">🇫🇷 Français</option>
        </select>

        {user?.role === 'BLOCKER' && (
          <Link
            to="/dashboard"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 border-1.5 border-brand-line rounded-xl text-sm font-semibold text-brand-ink hover:border-brand-green hover:text-brand-green transition-all bg-white"
          >
            <UserCheck className="w-4 h-4 text-brand-green" />
            Dashboard
          </Link>
        )}

        {user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
          </Link>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 border border-brand-line rounded-xl text-sm font-semibold text-brand-ink hover:bg-brand-bg-soft"
          >
            Log out
          </button>
        ) : (
          <>
            <Link
              to="/register"
              className="hidden sm:inline-flex px-3.5 py-2 border border-brand-line rounded-xl text-sm font-semibold text-brand-ink hover:bg-brand-bg-soft"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark"
            >
              <LogIn className="w-4 h-4" />
              Log in
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
