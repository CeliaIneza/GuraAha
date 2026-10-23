import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';
import { normalizePhone } from '../utils/phone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Please provide both your first and last name.');
      return;
    }
    if (!form.phone.trim()) {
      setError('Please provide a valid Rwandan phone number.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: normalizePhone(form.phone.trim()),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-dashboard flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-lg">
        
        {/* Main Registration Card with uniform 9px radius and seamless interior */}
        <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
          
          {/* Centered Card Header without SVG emblem and without divider line */}
          <CardHeader className="p-4 sm:p-6 text-center flex flex-col items-center">
            <CardTitle className="text-2xl font-bold text-brand-ink">
              Create an account
            </CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft mt-1 max-w-md leading-relaxed">
              Buyers start here. After login you can apply to become a Blocker and post listings.
            </CardDescription>
          </CardHeader>

          {/* Form Content directly following header with no dividing border */}
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 pt-2 space-y-4">
              
              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Name row: Firstname and Lastname on the same line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-ink">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={update('firstName')}
                    placeholder="Jean"
                    className="rounded-[9px] h-11 pl-3.5 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-ink">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={form.lastName}
                    onChange={update('lastName')}
                    placeholder="Mugabo"
                    className="rounded-[9px] h-11 pl-3.5 text-sm"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-ink">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="e.g. 0788 123 456"
                  className="rounded-[9px] h-11 pl-3.5 text-sm"
                />
                <p className="text-xs text-brand-ink-soft/80 flex items-center gap-1">
                  <span className="text-brand-green font-bold">✓</span> Enter without country code - we accept 078x, 072x, 073x
                </p>
              </div>

              {/* Email address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-ink">
                  Email address <span className="text-brand-ink-soft/70 font-normal">(optional)</span>
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@email.com"
                  className="rounded-[9px] h-11 pl-3.5 text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-ink">
                  Password <span className="text-brand-ink-soft/70 font-normal">(min 8 characters)</span>
                </label>
                <PasswordInput
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                  placeholder="Choose a strong password"
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
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>

              {/* Login link */}
              <p className="text-sm text-brand-ink-soft text-center">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-brand-green font-semibold hover:underline"
                >
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>

        </Card>

      </div>
    </div>
  );
};
