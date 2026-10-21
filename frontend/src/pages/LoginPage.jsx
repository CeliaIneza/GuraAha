import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';
import { normalizePhone } from '../utils/phone';

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
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier.trim(), password }
        : { phone: normalizePhone(identifier.trim()), password };

      const user = await login(payload);
      if (user?.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user?.role === 'BLOCKER') navigate('/dashboard', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-green to-[#00594A] rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <h1 className="text-2xl font-bold text-brand-ink mb-1">Welcome back</h1>
            <p className="text-sm text-brand-ink-soft">Log in with your phone number or email.</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5" htmlFor="identifier">
                Phone or email
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0788 123 456 or you@email.com"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">No country code needed for phone</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5" htmlFor="login-password">
                Password
              </label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm mt-2"
            >
              {submitting ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="text-sm text-brand-ink-soft mt-6 text-center">
            No account?{' '}
            <Link to="/register" className="text-brand-green font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
