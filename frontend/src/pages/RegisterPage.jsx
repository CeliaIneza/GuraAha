import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';
import { normalizePhone } from '../utils/phone';

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
    e.preventDefault();
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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#f0f7f4] to-white">
      <div className="w-full max-w-lg">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-lg">G</span>
          </div>
          <span className="text-2xl font-extrabold text-brand-ink tracking-tight">GuraAha</span>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-2xl px-8 py-10 shadow-xl">
          <h1 className="text-2xl font-bold text-brand-ink mb-1">Create an account</h1>
          <p className="text-sm text-brand-ink-soft mb-8">
            Buyers start here. After login you can apply to become a Blocker and post listings.
          </p>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">First name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.firstName}
                  onChange={update('firstName')}
                  placeholder="Jean"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Last name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.lastName}
                  onChange={update('lastName')}
                  placeholder="Mugabo"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={update('phone')}
                placeholder="e.g. 0788 123 456"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
              />
              <p className="text-xs text-brand-ink-soft mt-1.5 flex items-center gap-1">
                <span className="text-brand-green">✓</span> Enter without country code - we accept 078x, 072x, 073x
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email address <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@email.com"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
              />
              <p className="text-xs text-brand-ink-soft mt-1.5">Recommended - used for application status notifications</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password <span className="text-gray-400 font-normal">(min 8 characters)</span></label>
              <PasswordInput
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
                placeholder="Choose a strong password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-base mt-2"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-brand-ink-soft mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-green font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
