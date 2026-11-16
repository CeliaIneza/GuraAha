import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PasswordInput } from '../components/PasswordInput';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!token) { setError('Invalid or missing reset token. Please request a new link.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Failed to reset password');
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-dashboard flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-brand-pale flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6 text-brand-green" />
            </div>
            <CardTitle className="text-xl font-bold text-brand-ink">Set new password</CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft mt-1">
              Choose a strong password for your GuraAha account.
            </CardDescription>
          </CardHeader>

          {done ? (
            <CardContent className="p-6 sm:p-8 text-center space-y-4 pt-2">
              <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto" />
              <p className="text-sm text-brand-ink-soft">
                Password reset successfully! Redirecting to login...
              </p>
              <Link to="/login" className="text-sm text-brand-green font-semibold hover:underline block">
                Go to Login →
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 sm:p-8 pt-2 space-y-4">
                {!token && (
                  <div className="p-3.5 rounded-[9px] bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                    No reset token found. Please use the link from your email or{' '}
                    <Link to="/forgot-password" className="underline font-bold">request a new one</Link>.
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-ink">
                    New password <span className="text-brand-ink-soft font-normal">(min 8 characters)</span>
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="New password"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-ink">
                    Confirm password
                  </label>
                  <PasswordInput
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat new password"
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 sm:p-8 pt-0 flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading || !token}
                  variant="default"
                  className="w-full h-11 rounded-[9px] font-semibold"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </Button>
                <Link to="/login" className="text-sm text-brand-green font-semibold hover:underline text-center">
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
