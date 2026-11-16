import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { blockersApi } from '../api/blockers';
import { locationsApi } from '../api/locations';
import { ShieldCheck, Upload, FileText, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';

export const BecomeBlockerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [existingApp, setExistingApp] = useState(null);
  const [checkingApp, setCheckingApp] = useState(true);

  const [formData, setFormData] = useState({
    nationalId: '',
    operatingLocationId: '',
    agreementFile: null,
    acceptedTerms: false,
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Check if user already applied
  useEffect(() => {
    if (!user) {
      setCheckingApp(false);
      return;
    }
    blockersApi.me()
      .then((res) => {
        if (res && res.data) setExistingApp(res.data);
      })
      .catch(() => {})
      .finally(() => setCheckingApp(false));
  }, [user]);

  // Load provinces
  useEffect(() => {
    locationsApi.provinces()
      .then((res) => setProvinces(res.data || []))
      .catch(() => {});
  }, []);

  const handleProvinceChange = async (id) => {
    setSelectedProvince(id);
    setSelectedDistrict('');
    setSelectedSector('');
    setDistricts([]);
    setSectors([]);
    setFormData(p => ({ ...p, operatingLocationId: '' }));
    if (!id) return;
    const res = await locationsApi.children(id).catch(() => ({ data: [] }));
    setDistricts(res.data || []);
  };

  const handleDistrictChange = async (id) => {
    setSelectedDistrict(id);
    setSelectedSector('');
    setSectors([]);
    setFormData(p => ({ ...p, operatingLocationId: id }));
    if (!id) return;
    const res = await locationsApi.children(id).catch(() => ({ data: [] }));
    setSectors(res.data || []);
  };

  const handleSectorChange = (id) => {
    setSelectedSector(id);
    setFormData(p => ({ ...p, operatingLocationId: id }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) updateField('agreementFile', file);
  };

  const validate = () => {
    const e = {};
    if (!user) { e.form = 'You must be logged in to apply'; return e; }
    if (!formData.nationalId.trim() || formData.nationalId.replace(/\s/g, '').length < 16) {
      e.nationalId = 'National ID must be 16 digits';
    }
    if (!formData.operatingLocationId) {
      e.operatingLocationId = 'Please select your operating sector';
    }
    if (!formData.acceptedTerms) {
      e.acceptedTerms = 'You must accept the GuraAha Blocker Agreement to continue';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!user) { navigate('/login'); return; }

    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        nationalId: formData.nationalId.replace(/\s/g, ''),
        operatingLocationId: formData.operatingLocationId,
      };
      await blockersApi.apply(payload);
      setSubmittedEmail(user.email || '');
      setIsSubmitted(true);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingApp) {
    return (
      <div className="min-h-[85vh] bg-dashboard flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-[85vh] bg-dashboard py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-brand-ink">Login Required</h3>
              <p className="text-sm text-brand-ink-soft">You need to be logged in to apply as a Blocker.</p>
              <Button onClick={() => navigate('/login')} className="rounded-[9px]">Log in to apply</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Already applied
  if (existingApp && !isSubmitted) {
    const statusColors = {
      PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
      APPROVED: 'text-green-700 bg-green-50 border-green-200',
      REJECTED: 'text-red-600 bg-red-50 border-red-200',
      NEEDS_REVISION: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    const color = statusColors[existingApp.status] || statusColors.PENDING;
    return (
      <div className="min-h-[85vh] bg-dashboard py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-brand-green mx-auto" />
              <h3 className="text-xl font-bold text-brand-ink">Application Already Submitted</h3>
              <p className="text-sm text-brand-ink-soft">
                You have already submitted a Blocker application. Our team will review it and contact you.
              </p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${color}`}>
                Status: {existingApp.status}
              </div>
              {existingApp.rejection_reason && (
                <div className="text-left p-3 rounded-[9px] bg-red-50 border border-red-200 text-sm text-red-700">
                  <strong>Reason:</strong> {existingApp.rejection_reason}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-dashboard py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-6 text-center flex flex-col items-center">
            <CardTitle className="text-2xl font-bold text-brand-ink">
              Become a Blocker
            </CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft leading-relaxed mt-1 max-w-md">
              Earn commissions by listing land &amp; houses in your area. Every blocker is verified before going live.
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <CardContent className="p-6 sm:p-8 text-center space-y-4 pt-2">
              <div className="w-14 h-14 bg-brand-pale text-brand-green rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-brand-ink">Application Submitted for Verification</h3>
              <p className="text-sm text-brand-ink-soft max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{user.firstName || user.first_name}</strong>. Our compliance team will review your National ID and sector registration.
                {submittedEmail
                  ? <> You will receive an email confirmation at <strong>{submittedEmail}</strong>.</>
                  : <> You will be notified once reviewed.</>
                }
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 sm:p-8 pt-2 space-y-4">

                {errors.form && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errors.form}</span>
                  </div>
                )}

                {/* National ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-ink">
                    National ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => updateField('nationalId', e.target.value)}
                    placeholder="1 19xx x xxxxxxx x xx"
                    className={`rounded-[9px] h-11 pl-3 text-sm font-mono ${errors.nationalId ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                  />
                  {errors.nationalId && <p className="text-xs text-red-600 font-medium">{errors.nationalId}</p>}
                </div>

                {/* Location cascade */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-brand-ink">
                    Operating Area (Province → District → Sector) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Province */}
                    <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                      <SelectTrigger className="h-11 rounded-[9px] text-sm border-brand-line">
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[9px] max-h-60">
                        {provinces.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {/* District */}
                    <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!districts.length}>
                      <SelectTrigger className="h-11 rounded-[9px] text-sm border-brand-line disabled:opacity-50">
                        <SelectValue placeholder="District" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[9px] max-h-60">
                        {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {/* Sector */}
                    <Select value={selectedSector} onValueChange={handleSectorChange} disabled={!sectors.length}>
                      <SelectTrigger className="h-11 rounded-[9px] text-sm border-brand-line disabled:opacity-50">
                        <SelectValue placeholder="Sector" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[9px] max-h-60">
                        {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.operatingLocationId && <p className="text-xs text-red-600 font-medium">{errors.operatingLocationId}</p>}
                </div>

                {/* Upload agreement */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-brand-ink">
                    Upload signed agreement <span className="text-xs font-normal text-brand-ink-soft">(optional at this step)</span>
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-1.5 rounded-[9px] border border-brand-line bg-brand-bg-soft/30">
                    <label className="cursor-pointer inline-flex items-center">
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFileChange} className="hidden" />
                      <span className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-ink bg-white border border-brand-line rounded-[9px] shadow-xs hover:border-brand-green hover:text-brand-green transition-all">
                        <Upload className="w-3.5 h-3.5 text-brand-green" />
                        Choose file
                      </span>
                    </label>
                    <div className="flex-1 flex items-center justify-between text-xs text-brand-ink-soft min-w-0">
                      {formData.agreementFile ? (
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-brand-green shrink-0" />
                          <span className="font-semibold text-brand-ink truncate">{formData.agreementFile.name}</span>
                          <span className="text-[11px] shrink-0">({(formData.agreementFile.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      ) : (
                        <span className="italic">No file chosen</span>
                      )}
                      {formData.agreementFile && (
                        <button type="button" onClick={() => updateField('agreementFile', null)} className="p-1 text-brand-ink-soft hover:text-red-600 rounded-[9px]" title="Remove">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={formData.acceptedTerms}
                      onChange={(e) => updateField('acceptedTerms', e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-[4px] border-brand-line text-brand-green accent-[#007A66] cursor-pointer"
                    />
                    <span className="text-xs sm:text-[12px] text-brand-ink-soft leading-relaxed group-hover:text-brand-ink transition-colors">
                      I accept the <strong>GuraAha Blocker Agreement</strong>: I will only post properties I am authorised to represent, with truthful details and real photos, and I accept the commission &amp; conduct terms.
                    </span>
                  </label>
                  {errors.acceptedTerms && <p className="text-xs text-red-600 font-medium mt-1 pl-7">{errors.acceptedTerms}</p>}
                </div>
              </CardContent>

              <CardFooter className="p-6 sm:p-8 pt-0">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="default"
                  className="w-full h-11 rounded-[9px] font-semibold text-base shadow-sm active:translate-y-px"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting verification...</>
                  ) : 'Submit for verification'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
