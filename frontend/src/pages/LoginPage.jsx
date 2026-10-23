import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';
import { normalizePhone } from '../utils/phone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your phone number or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier.trim(), password }
        : { phone: normalizePhone(identifier.trim()), password };

      const user = await login(payload);
      if (user?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user?.role === 'BLOCKER') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-dashboard flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        
        {/* Main Login Card with uniform 9px radius and seamless interior */}
        <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
          
          {/* Centered Card Header with Logo at the center top (no badge, no divider line) */}
          <CardHeader className="p-4 sm:p-6 text-center flex flex-col items-center">
            <CardTitle className="text-2xl font-bold text-brand-ink">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft mt-1">
              Log in with your phone number or email.
            </CardDescription>
          </CardHeader>

          {/* Form Content directly under header without a divider line */}
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 pt-2 space-y-4">
              
              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Identifier Input (Phone or Email) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="block text-xs font-semibold text-brand-ink"
                >
                  Phone or email
                </label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="0788 123 456 or you@email.com"
                  autoComplete="username"
                  className="rounded-[9px] h-11 pl-3.5 text-sm"
                />
                <p className="text-xs text-brand-ink-soft/70">
                  No country code needed for phone
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-brand-ink"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-brand-green hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </div>

            </CardContent>

            {/* Submit Action */}
            <CardFooter className="p-6 sm:p-8 pt-2 flex flex-col gap-4">
              <Button
                type="submit"
                disabled={submitting}
                variant="default"
                className="w-full h-11 rounded-[9px] font-semibold text-sm sm:text-base shadow-sm active:translate-y-px"
              >
                {submitting ? 'Signing in…' : 'Log in'}
              </Button>

              {/* Registration Link */}
              <p className="text-sm text-brand-ink-soft text-center">
                No account?{' '}
                <Link
                  to="/register"
                  className="text-brand-green font-semibold hover:underline"
                >
                  Create one free
                </Link>
              </p>
            </CardFooter>
          </form>

        </Card>

      </div>
    </div>
  );
};
