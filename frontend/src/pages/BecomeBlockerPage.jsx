import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { blockersApi } from '../api/blockers';
import { RWANDA_30_DISTRICTS } from '../components/admin/PartnersTab';
import { CheckCircle2, AlertCircle, Upload, FileText, X, Loader2 } from 'lucide-react';

export const BecomeBlockerPage = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  const [selectedDistrict, setSelectedDistrict] = useState('Gasabo');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    areaText: 'Gasabo',
    username: '',
    password: '',
    confirmPassword: '',
    agreementFile: null,
    acceptedTerms: false,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      areaText: selectedDistrict,
    }));
  }, [selectedDistrict]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFullNameBlur = () => {
    if (!formData.username && formData.fullName.trim()) {
      const parts = formData.fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/);
      const suggested = parts[0] + (parts[1] ? '.' + parts[1][0] : '');
      if (suggested) {
        setFormData((prev) => ({ ...prev, username: suggested }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) updateField('agreementFile', file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullName = formData.fullName.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    const nationalId = formData.nationalId.trim();
    const areaText = formData.areaText.trim() || selectedDistrict;
    const username = formData.username.trim().toLowerCase().replace(/\s+/g, '');
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!fullName || !phone || !nationalId || !areaText) {
      setError('Please fill in your full name, phone (MoMo), National ID and primary area.');
      return;
    }
    if (!username || username.length < 3) {
      setError('Please choose a username (at least 3 characters, no spaces).');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please choose a password of at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    if (!formData.acceptedTerms) {
      setError('Please accept the Guraaha Blocker Agreement to submit your application.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await blockersApi.applyPublic({
        fullName,
        phone,
        email: email || undefined,
        nationalId,
        areaText,
        username,
        password,
      });

      const createdUsername = res?.data?.user?.username || username;
      setSubmittedData({
        fullName,
        username: createdUsername,
        phone,
        email,
        areaText,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F6F5F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-brand-line rounded-[14px] p-6 sm:p-8 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">
            {t('blocker_title')}
          </h2>
          <p className="text-sm sm:text-base text-brand-ink-soft mt-1.5 leading-relaxed">
            {t('blocker_sub')}
          </p>

          {submittedData ? (
            <div className="mt-6 p-6 rounded-[14px] bg-[#E0F2EE] border border-brand-green/30 text-center space-y-4">
              <div className="w-14 h-14 bg-white text-brand-green rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-brand-ink">
                ✅ Application received!
              </h3>
              <p className="text-sm text-brand-ink leading-relaxed max-w-lg mx-auto">
                Thank you, <strong>{submittedData.fullName}</strong>. Your application is now{' '}
                <strong>Pending validation</strong> by the Guraaha Admin.
              </p>
              <div className="bg-white rounded-[10px] p-4 border border-brand-line max-w-md mx-auto text-left text-xs sm:text-sm space-y-1.5">
                <div>
                  <span className="text-brand-ink-soft">Chosen username: </span>
                  <code className="font-mono font-bold text-brand-green-dark">
                    {submittedData.username}
                  </code>
                </div>
                <div>
                  <span className="text-brand-ink-soft">Phone (MoMo): </span>
                  <span className="font-semibold text-brand-ink">{submittedData.phone}</span>
                </div>
                <div>
                  <span className="text-brand-ink-soft">Primary area: </span>
                  <span className="font-semibold text-brand-ink">{submittedData.areaText}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-brand-ink-soft max-w-md mx-auto">
                Once approved by our team, you will receive your unique 6-character Blocker code via WhatsApp / Email and can log in using your username{' '}
                <strong>{submittedData.username}</strong> and password.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer transition-colors"
                >
                  Go to Log in →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-[9px] border border-brand-line bg-white text-brand-ink font-semibold text-sm cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Row 1: Full Name & Phone (MoMo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    {t('blocker_fullname')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    onBlur={handleFullNameBlur}
                    placeholder="Jean-Claude Niyonzima"
                    className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    {t('blocker_phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="078..."
                    className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Row 2: Email Address & National ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    {t('blocker_email') || 'Email address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    {t('blocker_nid')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nationalId}
                    onChange={(e) => updateField('nationalId', e.target.value)}
                    placeholder="1 19xx x xxxxxxx x xx"
                    className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm font-mono text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Row 3: Primary Area (District) */}
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  {t('blocker_area') || 'Primary area (District)'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full h-11 px-3 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                >
                  {RWANDA_30_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Choose login credentials box */}
              <div className="bg-[#F6F5F0] border border-brand-line rounded-[12px] p-4 space-y-3">
                <div className="font-bold text-xs sm:text-sm text-[#00594A]">
                 {t('blocker_creds_title')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    {t('blocker_username')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    placeholder="e.g. jean.n"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      {t('blocker_password')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      {t('blocker_password2')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="Confirm password"
                      className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Upload signed agreement (optional at this step) */}
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  {t('blocker_upload')}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-2 rounded-[9px] border border-brand-line bg-[#F6F5F0]/60">
                  <label className="cursor-pointer inline-flex items-center">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-ink bg-white border border-brand-line rounded-[8px] shadow-2xs hover:border-brand-green hover:text-brand-green transition-all">
                      <Upload className="w-3.5 h-3.5 text-brand-green" />
                      Choose file
                    </span>
                  </label>
                  <div className="flex-1 flex items-center justify-between text-xs text-brand-ink-soft min-w-0">
                    {formData.agreementFile ? (
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-brand-green shrink-0" />
                        <span className="font-semibold text-brand-ink truncate">
                          {formData.agreementFile.name}
                        </span>
                      </div>
                    ) : (
                      <span className="italic">No file chosen</span>
                    )}
                    {formData.agreementFile && (
                      <button
                        type="button"
                        onClick={() => updateField('agreementFile', null)}
                        className="p-1 text-brand-ink-soft hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 5: Agreement Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => updateField('acceptedTerms', e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-brand-line accent-[#007A66] cursor-pointer"
                  />
                  <span className="text-xs sm:text-[13px] text-brand-ink-soft leading-relaxed">
                    {t('blocker_agree')}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-[10px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>{t('blocker_submit')}</span>
                )}
              </button>

              <p className="text-center text-xs sm:text-sm text-brand-ink-soft pt-2">
                {t('login_have_account') || 'Already have an account?'}{' '}
                <Link to="/login" className="text-brand-green font-semibold hover:underline">
                  {t('login_btn') || 'Log in'}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
