import React, { useState } from 'react';
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
import { sectorsByDistrict } from '../data/mockData';
import { ShieldCheck, Upload, FileText, CheckCircle2, X } from 'lucide-react';

// Format all sectors as "Sector, District"
const sectorOptions = Object.entries(sectorsByDistrict).flatMap(([district, sectors]) =>
  sectors.map((sector) => ({
    value: `${sector}, ${district}`,
    label: `${sector}, ${district}`,
  }))
);

const sectorItemsMap = Object.fromEntries(
  sectorOptions.map((opt) => [opt.value, opt.label])
);

// Form Hook that collects and validates blocker application data
export function useBecomeBlockerForm(onSubmitSuccess) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    nationalId: '',
    primarySector: 'Remera, Gasabo',
    agreementFile: null,
    acceptedTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'fullName') next.username = value;
      if (field === 'username') next.fullName = value;
      return next;
    });

    if (errors[field] || (field === 'fullName' && errors.username)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.fullName;
        delete next.username;
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};
    const name = formData.fullName.trim() || formData.username.trim();
    if (!name) {
      nextErrors.fullName = 'Full name is required';
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s]{8,15}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      nextErrors.phone = 'Enter a valid Rwandan phone number';
    }
    if (!formData.nationalId.trim()) {
      nextErrors.nationalId = 'National ID is required';
    } else if (formData.nationalId.replace(/\s/g, '').length < 16) {
      nextErrors.nationalId = 'National ID must be 16 digits (1 19xx...)';
    }
    if (!formData.primarySector) {
      nextErrors.primarySector = 'Primary area (Sector) is required';
    }
    if (!formData.acceptedTerms) {
      nextErrors.acceptedTerms = 'You must accept the GuraAha Blocker Agreement to continue';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Simulate submission API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitted(true);
      onSubmitSuccess?.(formData);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      username: '',
      phone: '',
      nationalId: '',
      primarySector: 'Remera, Gasabo',
      agreementFile: null,
      acceptedTerms: false,
    });
    setErrors({});
    setIsSubmitted(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    isSubmitted,
    updateField,
    handleSubmit,
    resetForm,
  };
}

export const BecomeBlockerPage = () => {
  const {
    formData,
    errors,
    isSubmitting,
    isSubmitted,
    updateField,
    handleSubmit,
    resetForm,
  } = useBecomeBlockerForm();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('agreementFile', file);
    }
  };

  const removeFile = () => {
    updateField('agreementFile', null);
  };

  return (
    <div className="min-h-[85vh] bg-dashboard py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Application Card with 9px border radius */}
        <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-6 text-center flex flex-col items-center">
            <CardTitle className="text-2xl font-bold text-brand-ink">
              Become a Blocker
            </CardTitle>
            <CardDescription className="text-sm text-brand-ink-soft leading-relaxed mt-1 max-w-md">
              Earn commissions by listing land & houses in your area. Every blocker is verified before going live.
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <CardContent className="p-6 sm:p-8 text-center space-y-4 pt-2">
              <div className="w-14 h-14 bg-brand-pale text-brand-green rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-brand-ink">Application Submitted for Verification</h3>
              <p className="text-sm text-brand-ink-soft max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{formData.fullName || formData.username}</strong>. Our compliance team will review your National ID and sector registration. You will receive an SMS confirmation at <strong>{formData.phone}</strong>.
              </p>
              <div className="pt-4">
                <Button variant="outline" onClick={resetForm} className="rounded-[9px] h-10 px-6 font-semibold">
                  Submit another application
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 sm:p-8 pt-2 space-y-4">
                
                {/* Row 1: two inputs per row (username / full name & phone number) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-brand-ink">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="e.g. Habimana Jean"
                      className={`rounded-[9px] h-11 pl-3 text-sm ${
                        errors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : ''
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-600 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-brand-ink">
                      Phone (MoMo) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+2507 8xx xxx xx"
                      className={`rounded-[9px] h-11 pl-3 text-sm ${
                        errors.phone ? 'border-red-500 ring-1 ring-red-500/20' : ''
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600 font-medium">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: two inputs per row (National ID & Primary area (sector)) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-brand-ink">
                      National ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => updateField('nationalId', e.target.value)}
                      placeholder="1 19xx x xxxxxxx x xx"
                      className={`rounded-[9px] h-11 pl-3 text-sm font-mono ${
                        errors.nationalId ? 'border-red-500 ring-1 ring-red-500/20' : ''
                      }`}
                    />
                    {errors.nationalId && (
                      <p className="text-xs text-red-600 font-medium">{errors.nationalId}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-brand-ink">
                      Primary area (Sector) <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.primarySector}
                      onValueChange={(val) => updateField('primarySector', val)}
                      items={sectorItemsMap}
                    >
                      <SelectTrigger className="w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white px-3">
                        <SelectValue placeholder="Remera, Gasabo" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start" sideOffset={6} className="rounded-[9px] max-h-60">
                        {sectorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.primarySector && (
                      <p className="text-xs text-red-600 font-medium">{errors.primarySector}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Attachment component for file upload */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-brand-ink">
                    Upload signed agreement <span className="text-xs font-normal text-brand-ink-soft">(optional at this step)</span>
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-1.5 rounded-[9px] border border-brand-line bg-brand-bg-soft/30 hover:bg-brand-bg-soft/50 transition-colors">
                    <label className="cursor-pointer inline-flex items-center">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
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
                          <span className="text-[11px] text-brand-ink-soft shrink-0">
                            ({(formData.agreementFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      ) : (
                        <span className="text-brand-ink-soft italic">No file chosen</span>
                      )}

                      {formData.agreementFile && (
                        <button
                          type="button"
                          onClick={removeFile}
                          className="p-1 text-brand-ink-soft hover:text-red-600 rounded-[9px] hover:bg-white transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 4: Agreement Terms Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={formData.acceptedTerms}
                      onChange={(e) => updateField('acceptedTerms', e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-[4px] border-brand-line text-brand-green focus:ring-brand-green accent-[#007A66] cursor-pointer"
                    />
                    <span className="text-xs sm:text-[12px] text-brand-ink-soft leading-relaxed group-hover:text-brand-ink transition-colors">
                      I accept the <strong>GuraAha Blocker Agreement</strong>: I will only post properties I am authorised to represent, with truthful details and real photos, and I accept the commission & conduct terms.
                    </span>
                  </label>
                  {errors.acceptedTerms && (
                    <p className="text-xs text-red-600 font-medium mt-1 pl-7">{errors.acceptedTerms}</p>
                  )}
                </div>

              </CardContent>

              {/* Row 5 / CardFooter: Submit for verification */}
              <CardFooter className="p-6 sm:p-8 pt-0">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="default"
                  className="w-full h-11 rounded-[9px] font-semibold text-base shadow-sm active:translate-y-px"
                >
                  {isSubmitting ? 'Submitting verification...' : 'Submit for verification'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

      </div>
    </div>
  );
};
