import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { PasswordInput } from '../components/PasswordInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AlertCircle, LogOut } from 'lucide-react';

export const LoginPage = () => {
  const { user, login, logout } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loggedInName = user
    ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() ||
      user.username ||
      user.email ||
      user.phone ||
      'current user'
    : '';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (user) {
      setError(
        `You are already logged in as ${loggedInName} (${user.role}). Please log out first before logging in again.`
      );
      return;
    }

    const rawId = identifier.trim();
    if (!rawId) {
      setError('Please enter your username, phone number or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      // Send universal identifier so backend matches username, email, or phone in any format (078..., 25078..., +25078...)
      const loggedUser = await login({
        identifier: rawId,
        password,
      });

      if (loggedUser?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (loggedUser?.role === 'BLOCKER') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(
        err.message ||
          'Invalid username/phone/email or password. Check your details or apply at "Become a Blocker".'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F6F5F0] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <Card className="rounded-[14px] border-brand-line bg-white shadow-xs overflow-hidden">
          <CardHeader className="p-6 pb-2 text-center flex flex-col items-center">
            <CardTitle className="text-2xl font-bold text-brand-ink">
              {t('login_title') || 'Log in'}
            </CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft mt-1.5 leading-relaxed">
              {t('login_sub')}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="p-6 sm:p-8 pt-4 space-y-4">
              {user && !error && (
                <div className="flex flex-col gap-2.5 p-3.5 rounded-[9px] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      You are already logged in as <strong>{loggedInName}</strong> ({user.role}).
                      Please log out first before logging in with another account.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out now
                    </button>
                    <Link
                      to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                      className="px-3 py-1.5 rounded-[8px] bg-white border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors"
                    >
                      Go to {user.role === 'ADMIN' ? 'Admin Panel' : 'My Profile / Dashboard'}
                    </Link>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col gap-2.5 p-3.5 rounded-[9px] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                  {user && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          setError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log out now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Universal Identifier: Username, Phone (MoMo), or Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="block text-xs font-semibold text-brand-ink"
                >
                  {t('login_user_lbl')}
                </label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. jean.n or 0788 123 456 or you@email.com"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="rounded-[9px] h-11 pl-3.5 text-sm"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-brand-ink"
                  >
                    {t('login_pass_lbl')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-brand-green hover:underline"
                  >
                    {t('auth_forgot_password')}
                  </Link>
                </div>
                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
            </CardContent>

            <CardFooter className="p-6 sm:p-8 pt-0 flex flex-col gap-3.5">
              <Button
                type="submit"
                disabled={submitting}
                variant="default"
                className="w-full h-11 rounded-[9px] font-semibold text-sm sm:text-base shadow-xs cursor-pointer"
              >
                {submitting ? 'Signing in…' : `${t('login_btn')} →`}
              </Button>

              <div className="w-full pt-2 border-t border-brand-line flex flex-col gap-2 text-center text-xs sm:text-sm text-brand-ink-soft">
                <div>
                  {t('login_no_account')}{' '}
                  <Link
                    to="/become-blocker"
                    className="text-brand-green font-semibold hover:underline"
                  >
                    {t('nav_blocker')} →
                  </Link>
                </div>
                <div>
                  Looking to buy or rent?{' '}
                  <Link
                    to="/register"
                    className="text-brand-green font-semibold hover:underline"
                  >
                    {t('auth_create_one_free')}
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
