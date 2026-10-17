import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login({ phone, password });
      if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user.role === 'BLOCKER') navigate('/dashboard', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 min-h-[70vh]">
      <div className="bg-white border border-brand-line rounded-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">Log in</h1>
        <p className="text-sm text-brand-ink-soft mb-6">
          Use the phone number and password you registered with.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2507xxxxxxxx"
              className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-brand-ink-soft mt-5 text-center">
          No account yet?{' '}
          <Link to="/register" className="text-brand-green font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};
