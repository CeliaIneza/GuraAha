import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
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
    <div className="max-w-md mx-auto px-6 py-16 min-h-[70vh]">
      <div className="bg-white border border-brand-line rounded-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">Create an account</h1>
        <p className="text-sm text-brand-ink-soft mb-6">
          Buyers start here. After login you can apply to become a blocker.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">First name</label>
              <input
                required
                value={form.firstName}
                onChange={update('firstName')}
                className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Last name</label>
              <input
                required
                value={form.lastName}
                onChange={update('lastName')}
                className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Phone</label>
            <input
              type="tel"
              required
              minLength={8}
              value={form.phone}
              onChange={update('phone')}
              placeholder="+2507xxxxxxxx"
              className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-brand-ink-soft mt-5 text-center">
          Already registered?{' '}
          <Link to="/login" className="text-brand-green font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
