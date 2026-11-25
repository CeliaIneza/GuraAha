import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { t } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email address, username, or phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(identifier.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F6F5F0] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        <Card className="rounded-[14px] border-brand-line bg-white shadow-xs overflow-hidden">
          <CardHeader className="p-6 pb-2 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-brand-pale flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-brand-green" />
            </div>
            <CardTitle className="text-xl font-bold text-brand-ink">
              {t('auth_forgot_password')}
            </CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft mt-1 max-w-xs">
              Enter your registered email address, username, or phone number and we&apos;ll send a reset link from{' '}
              <span className="font-mono font-semibold text-brand-green-dark">
                noreply@guraaha.com
              </span>
              .
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="p-6 sm:p-8 text-center space-y-4 pt-2">
              <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto" />
              <p className="text-sm text-brand-ink-soft leading-relaxed">
                If <strong>{identifier}</strong> has a registered email address, a password reset link has been sent from{' '}
                <strong>noreply@guraaha.com</strong>. Please check your inbox (and spam folder).
              </p>
              <Link
                to="/login"
                className="text-sm text-brand-green font-semibold hover:underline block"
              >
                ← Back to Login
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 sm:p-8 pt-2 space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-ink">
                    Email, Username or Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@email.com or username or 078..."
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="rounded-[9px] h-11 pl-3.5 text-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 sm:p-8 pt-0 flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="w-full h-11 rounded-[9px] font-semibold cursor-pointer"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
                <Link
                  to="/login"
                  className="text-sm text-brand-green font-semibold hover:underline text-center"
                >
                  ← Back to Login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
