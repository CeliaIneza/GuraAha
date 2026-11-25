import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, LogIn, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const isRw = lang === 'rw';
  const isActive = (path) => {
    if (path === '/browse') {
      return location.pathname === '/browse' || location.pathname.startsWith('/listing/');
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  // News is displayed on the homepage news section (and via Notification Bell), not in the top navbar
  const navItems = [
    ['/', t('nav_home')],
    ['/browse', t('nav_browse')],
    ['/vip-room', t('nav_vip')],
    ['/membership', t('nav_membership')],
    ['/partners', t('nav_partners')],
    ['/become-blocker', t('nav_blocker')],
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white border-b border-brand-line shadow-xs flex items-center justify-between flex-nowrap transition-all duration-150 ${
          isRw
            ? 'px-3 sm:px-5 lg:px-6 py-2.5 gap-2 lg:gap-3'
            : 'px-4 sm:px-7 py-2.5 gap-3 lg:gap-4'
        }`}
      >
        {/* Official Guraaha.com Logo */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center text-brand-ink no-underline group shrink-0"
          aria-label="Guraaha.com"
        >
          <img
            src="/guraaha-logo.png"
            alt="Guraaha.com"
            className="h-9 sm:h-11 w-auto block transition-transform group-hover:scale-[1.02]"
          />
        </Link>

        {/* Desktop Navigation Links (shown on xl+ screens >= 1180px) */}
        <nav
          className={`hidden xl:flex items-center flex-nowrap shrink ${
            isRw ? 'gap-0.5 py-0.5' : 'gap-1.5 py-1'
          }`}
        >
          {navItems.map(([path, label]) => (
            <Link
              key={path}
              to={path}
              className={`rounded-[9px] border font-medium transition-colors whitespace-nowrap ${
                isRw
                  ? 'px-2 lg:px-2.5 py-1.5 text-xs lg:text-[13px]'
                  : 'px-3 py-1.5 text-[13.5px]'
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

        {/* Right Actions & Mobile Hamburger Button */}
        <div
          className={`flex items-center shrink-0 ml-auto xl:ml-0 ${
            isRw ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-2.5'
          }`}
        >
          {/* Desktop Language Selector */}
          <div className="hidden xl:block">
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
                    : 'w-[145px] sm:w-[158px] h-9 text-sm px-3'
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
          </div>

          <NotificationBell />

          {(user?.role === 'BLOCKER' || user?.role === 'USER') && (
            <Button
              asChild
              variant="outline"
              size={isRw ? 'sm' : 'default'}
              className={`hidden xl:inline-flex rounded-[9px] border-2 ${
                isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
              }`}
            >
              <Link to="/dashboard">
                <UserCheck className={`${isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-brand-green`} />
                {user?.role === 'BLOCKER' ? t('nav_dashboard') : 'My Profile'}
              </Link>
            </Button>
          )}

          {user?.role === 'ADMIN' && (
            <Button
              asChild
              variant="default"
              size={isRw ? 'sm' : 'default'}
              className={`hidden xl:inline-flex rounded-[9px] border-2 ${
                isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
              }`}
            >
              <Link to="/admin">
                <ShieldCheck className={isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                {t('nav_admin')}
              </Link>
            </Button>
          )}

          {user ? (
            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              size={isRw ? 'sm' : 'default'}
              className={`hidden xl:inline-flex rounded-[9px] border-2 ${
                isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
              }`}
            >
              <LogOut className={`${isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-brand-ink-soft`} />
              <span>{t('dash_logout')}</span>
            </Button>
          ) : (
            <div className="hidden xl:flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size={isRw ? 'sm' : 'default'}
                className={`rounded-[9px] border-2 ${
                  isRw ? 'px-2.5 py-1 text-xs sm:text-sm h-8.5' : ''
                }`}
              >
                <Link to="/login">
                  <LogIn className={`${isRw ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                  <span>{t('login_btn') || 'Log in'}</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Button (shown below xl < 1180px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            className="xl:hidden w-10 h-10 rounded-[10px] border border-brand-line bg-white hover:bg-brand-bg-soft text-brand-ink inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-b-2 border-brand-green shadow-2xl px-4 py-3.5 flex flex-col gap-1.5 z-50 max-h-[calc(100vh-64px)] overflow-y-auto">
            {navItems.map(([path, label]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-3 rounded-[10px] text-[15px] font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-brand-green text-white font-semibold'
                    : 'text-brand-ink hover:bg-brand-bg-soft'
                }`}
              >
                {label}
              </Link>
            ))}

            <div className="mt-2 pt-3 border-t border-brand-line flex flex-col gap-2.5">
              {/* Mobile Language Selector */}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Language"
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-brand-line bg-white text-sm font-semibold text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="rw">🇷🇼 Kinyarwanda</option>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
              </select>

              {user ? (
                <div className="flex flex-col gap-2">
                  {(user.role === 'BLOCKER' || user.role === 'USER') && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 rounded-[10px] bg-brand-green text-white font-semibold text-sm text-center"
                    >
                      {user.role === 'BLOCKER' ? t('nav_dashboard') : 'My Profile'}
                    </Link>
                  )}

                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 rounded-[10px] bg-brand-green text-white font-semibold text-sm text-center"
                    >
                      🔒 {t('nav_admin')}
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-[10px] border border-red-200 bg-red-50 text-red-700 font-semibold text-sm text-center cursor-pointer"
                  >
                    {t('dash_logout')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-4 rounded-[10px] border-2 border-brand-green text-brand-green font-semibold text-sm text-center hover:bg-brand-green/5"
                  >
                    {t('login_btn') || 'Log in'}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-4 rounded-[10px] bg-brand-green text-white font-semibold text-sm text-center hover:bg-brand-green-dark"
                  >
                    {t('auth_create_account_btn') || 'Register'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="xl:hidden fixed inset-0 bg-black/35 z-40"
        />
      )}
    </>
  );
};
