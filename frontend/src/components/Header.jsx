import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, LogIn, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const languageOptions = {
  rw: '🇷🇼 Kinyarwanda',
  en: '🇬🇧 English',
  fr: '🇫🇷 Français',
};

export const Header = () => {
  const { lang, setLang, t } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isRw = lang === 'rw';
  const isActive = (path) => {
    if (path === '/browse') {
      return location.pathname === '/browse' || location.pathname.startsWith('/listing/');
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b border-brand-line shadow-xs flex items-center justify-between flex-nowrap transition-all duration-150 ${
        isRw
          ? 'px-3 sm:px-5 lg:px-6 py-2.5 gap-2 lg:gap-3'
          : 'px-4 sm:px-8 py-3 gap-3 lg:gap-4'
      }`}
    >
      {/* Brand Logo & Name - shrink-0 ensures logo never compresses */}
      <Link
        to="/"
        className={`flex items-center text-brand-ink no-underline group shrink-0 ${
          isRw ? 'gap-2' : 'gap-2.5'
        }`}
      >
        <svg
          className={`w-auto transition-transform group-hover:scale-105 ${
            isRw ? 'h-9 sm:h-10' : 'h-10 sm:h-11'
          }`}
          viewBox="60 0 400 460"
          xmlns="http://www.w3.org/2000/svg"
        >
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
        <span
          className={`font-bold tracking-tight text-brand-ink ${
            isRw ? 'text-xl sm:text-2xl' : 'text-2xl'
          }`}
        >
          guraaha
        </span>
      </Link>

      {/* Navigation Links - fits smoothly without horizontal scrolling */}
      <nav
        className={`flex items-center flex-nowrap shrink ${
          isRw ? 'gap-0.5 sm:gap-1 py-0.5' : 'gap-1 sm:gap-2 py-1'
        }`}
      >
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
            className={`rounded-[9px] border font-medium transition-colors whitespace-nowrap ${
              isRw
                ? 'px-2 lg:px-2.5 py-1.5 text-xs lg:text-[13px]'
                : 'px-3 py-2 text-sm'
            } ${
              isActive(path)
                ? 'bg-brand-green text-white font-semibold shadow-xs border-brand-green'
                : 'text-brand-ink-soft hover:bg-brand-bg-soft hover:text-brand-ink border-transparent'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Actions & Language Selector - compact sizing in Kinyarwanda */}
      <div
        className={`flex items-center shrink-0 ml-auto sm:ml-0 ${
          isRw ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3'
        }`}
      >
        <Select
          value={lang}
          onValueChange={(val) => {
            if (val) setLang(val);
          }}
          items={languageOptions}
        >
          <SelectTrigger
            className={`rounded-[9px] ${
              isRw
                ? 'w-[140px] sm:w-[155px] h-8.5 text-xs sm:text-sm px-2.5'
                : 'w-[155px] sm:w-[172px] h-9.5 text-sm px-3'
            }`}
          >
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end" sideOffset={6}>
            <SelectItem value="rw">🇷🇼 Kinyarwanda</SelectItem>
            <SelectItem value="en">🇬🇧 English</SelectItem>
            <SelectItem value="fr">🇫🇷 Français</SelectItem>
          </SelectContent>
        </Select>

        {user?.role === 'BLOCKER' && (
          <Button
            asChild
            variant="outline"
            size={isRw ? 'sm' : 'default'}
            className={`hidden md:inline-flex rounded-[9px] border-2 ${
              isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
            }`}
          >
            <Link to="/dashboard">
              <UserCheck className={`${isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-brand-green`} />
              Dashboard
            </Link>
          </Button>
        )}

        {user?.role === 'ADMIN' && (
          <Button
            asChild
            variant="default"
            size={isRw ? 'sm' : 'default'}
            className={`rounded-[9px] border-2 ${
              isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
            }`}
          >
            <Link to="/admin">
              <ShieldCheck className={isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              Admin
            </Link>
          </Button>
        )}

        {user ? (
          <Button
            onClick={handleLogout}
            variant="outline"
            size={isRw ? 'sm' : 'default'}
            className={`rounded-[9px] border-2 ${
              isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
            }`}
          >
            <LogOut className={`${isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-brand-ink-soft`} />
            Log out
          </Button>
        ) : (
          <>
            <Button
              asChild
              variant="outline"
              size={isRw ? 'sm' : 'default'}
              className={`hidden sm:inline-flex rounded-[9px] border-2 ${
                isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
              }`}
            >
              <Link to="/register">
                Register
              </Link>
            </Button>

            {/* Shadcn Button testing on the login action */}
            <Button
              asChild
              variant="default"
              size={isRw ? 'sm' : 'default'}
              className={`relative group rounded-[9px] border-2 ${
                isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
              }`}
            >
              <Link to="/login">
                <LogIn className={`${isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform group-hover:translate-x-0.5`} />
                <span>Log in</span>
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
