import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { LocationCascade } from '../LocationCascade';
import { listingsApi } from '../../api/listings';
import { useApp } from '../../context/AppContext';
import { Upload, X, Phone, ArrowRight, Loader2, AlertTriangle, FileText } from 'lucide-react';

const errorInputClass = 'border-red-500 ring-1 ring-red-500/20';

const emptyForm = {
  titleRw: '',
  titleEn: '',
  titleFr: '',
  descriptionRw: '',
  descriptionEn: '',
  descriptionFr: '',
  category: 'Residential',
  subType: 'Houses',
  condition: 'Finished',
  deal: 'sale',
  rentalTerms: '',
  priceRwf: '',
  sizeValue: '',
  sizeUnit: 'sqm',
  villageId: '',
  locationComplete: false,
  upiNumber: '',
  ownershipDoc: null,
  ownerName: '',
  ownerPhone: '',
  isVip: false,
  vipWasPriceRwf: '',
  vipReason: '',
  photos: [],
};

export const AddPropertyTab = ({ onCancel, onSuccess }) => {
  const { categories, settings, tCat } = useApp();
  const [formData, setFormData] = useState(emptyForm);
  const [langTab, setLangTab] = useState('en'); // 'rw' | 'en' | 'fr'
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [cascadeKey, setCascadeKey] = useState(0);

  const clearError = (...keys) =>
    setErrors((prev) => {
      if (!keys.some((k) => prev[k])) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
    if (['titleEn', 'titleRw', 'titleFr'].includes(field)) clearError('title');
  };

  const setLocation = ({ locationId, selected }) => {
    setFormData((prev) => ({
      ...prev,
      villageId: locationId,
      locationComplete: !!selected?.village,
    }));
    clearError('villageId');
  };

  const handlePhotosSelect = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
    const combined = [...formData.photos, ...newFiles].slice(0, 8);
    photoPreviews.forEach((u) => URL.revokeObjectURL(u));
    setFormData((prev) => ({ ...prev, photos: combined }));
    setPhotoPreviews(combined.map((f) => URL.createObjectURL(f)));
    clearError('photos');
  };

  const removePhotoAt = (idx) => {
    const nextFiles = formData.photos.filter((_, i) => i !== idx);
    photoPreviews.forEach((u) => URL.revokeObjectURL(u));
    setFormData((prev) => ({ ...prev, photos: nextFiles }));
    setPhotoPreviews(nextFiles.map((f) => URL.createObjectURL(f)));
  };

  const selectedCatObj = useMemo(
    () =>
      categories.find(
        (c) => c.name_en === formData.category || c.slug === formData.category
      ) || categories[0],
    [categories, formData.category]
  );

  const subTypes = useMemo(
    () => selectedCatObj?.subtypes || selectedCatObj?.subTypes || [],
    [selectedCatObj]
  );

  const isRent = formData.deal === 'rent';

  const validate = () => {
    const e = {};
    if (!(formData.titleEn.trim() || formData.titleRw.trim() || formData.titleFr.trim())) {
      e.title = 'Enter a property title in at least one language (RW / EN / FR)';
    }
    if (!formData.priceRwf || Number(formData.priceRwf) <= 0) {
      e.priceRwf = 'Enter a valid price in RWF';
    }
    if (!formData.sizeValue || Number(formData.sizeValue) <= 0) {
      e.sizeValue = 'Enter a valid size in m²';
    }
    if (!formData.villageId || !formData.locationComplete) {
      e.villageId = 'Select the location down to the Village level';
    }
    if (!formData.photos || formData.photos.length < 3) {
      e.photos = `Please upload at least 3 photos (${formData.photos?.length || 0}/3 selected)`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const catLower = String(formData.category || '').toLowerCase();
      const legacyType = catLower.includes('land') ? 'land' : 'house';

      const { data } = await listingsApi.create({
        villageId: formData.villageId,
        type: legacyType,
        deal: formData.deal || 'sale',
        category: formData.category || 'Residential',
        subType: formData.subType || formData.category || 'Houses',
        condition: formData.condition || undefined,
        rentalTerms: isRent ? formData.rentalTerms || undefined : undefined,
        titleEn: formData.titleEn || formData.titleRw || formData.titleFr || undefined,
        titleRw: formData.titleRw || undefined,
        titleFr: formData.titleFr || undefined,
        descriptionEn:
          formData.descriptionEn || formData.descriptionRw || formData.descriptionFr || undefined,
        descriptionRw: formData.descriptionRw || undefined,
        descriptionFr: formData.descriptionFr || undefined,
        priceRwf: Number(formData.priceRwf),
        sizeValue: Number(formData.sizeValue),
        sizeUnit: 'sqm',
        upiNumber: formData.upiNumber || undefined,
        ownerName: formData.ownerName || undefined,
        ownerPhone: formData.ownerPhone || undefined,
        isVip: Boolean(formData.isVip),
        vipWasPriceRwf:
          formData.isVip && formData.vipWasPriceRwf
            ? Number(formData.vipWasPriceRwf)
            : undefined,
        vipReason: formData.isVip && formData.vipReason ? formData.vipReason : undefined,
      });

      await Promise.all(
        (formData.photos || []).map((file, idx) =>
          listingsApi.addPhoto(data.id, file, idx)
        )
      );

      const { data: mine } = await listingsApi.getMine();
      photoPreviews.forEach((u) => URL.revokeObjectURL(u));
      setFormData(emptyForm);
      setPhotoPreviews([]);
      setCascadeKey((n) => n + 1);
      onSuccess?.(mine || []);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit property listing.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ownerUnlockFee = settings?.ownerUnlockFee || 200;

  return (
    <Card className="rounded-[12px] border-brand-line bg-white shadow-sm overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-brand-line">
        <CardTitle className="text-xl font-bold text-brand-ink">
          Post a new listing
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-brand-ink-soft mt-1">
          Submit verified property details. Every listing goes to the Admin approval queue before going public.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="p-5 sm:p-7 space-y-5">
          {/* 1. Title & Description (RW / EN / FR tabs) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-ink">
                Title (RW / EN / FR tabs) <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-[8px] border border-brand-line bg-brand-bg-soft p-0.5 gap-0.5">
                {[
                  ['rw', '🇷🇼 RW'],
                  ['en', '🇬🇧 EN'],
                  ['fr', '🇫🇷 FR'],
                ].map(([code, lbl]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLangTab(code)}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition-colors ${
                      langTab === code
                        ? 'bg-brand-green text-white'
                        : 'text-brand-ink-soft hover:text-brand-ink'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {langTab === 'rw' && (
              <div className="space-y-2">
                <Input
                  value={formData.titleRw}
                  onChange={(e) => updateField('titleRw', e.target.value)}
                  placeholder="e.g. Ikibanza cyo guturamo kireba imisozi — Remera"
                  className={`rounded-[9px] h-11 pl-3 text-sm ${errors.title ? errorInputClass : ''}`}
                />
                <Textarea
                  value={formData.descriptionRw}
                  onChange={(e) => updateField('descriptionRw', e.target.value)}
                  rows={2}
                  placeholder="Ibisobanuro by'umutungo mu Kinyarwanda..."
                />
              </div>
            )}

            {langTab === 'en' && (
              <div className="space-y-2">
                <Input
                  value={formData.titleEn}
                  onChange={(e) => updateField('titleEn', e.target.value)}
                  placeholder="e.g. Residential plot with mountain view — Remera"
                  className={`rounded-[9px] h-11 pl-3 text-sm ${errors.title ? errorInputClass : ''}`}
                />
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => updateField('descriptionEn', e.target.value)}
                  rows={2}
                  placeholder="Property description in English..."
                />
              </div>
            )}

            {langTab === 'fr' && (
              <div className="space-y-2">
                <Input
                  value={formData.titleFr}
                  onChange={(e) => updateField('titleFr', e.target.value)}
                  placeholder="e.g. Parcelle résidentielle avec vue sur montagne — Remera"
                  className={`rounded-[9px] h-11 pl-3 text-sm ${errors.title ? errorInputClass : ''}`}
                />
                <Textarea
                  value={formData.descriptionFr}
                  onChange={(e) => updateField('descriptionFr', e.target.value)}
                  rows={2}
                  placeholder="Description du bien en Français..."
                />
              </div>
            )}
            {errors.title && <p className="text-xs text-red-600 font-medium">{errors.title}</p>}
          </div>

          {/* 2. Property type, Sub-type, Condition, Listing for */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Property type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  updateField('category', newCat);
                  const found = categories.find(
                    (c) => c.name_en === newCat || c.slug === newCat
                  );
                  const firstSub = (found?.subtypes || found?.subTypes || [])[0];
                  updateField('subType', firstSub ? firstSub.name_en : newCat);
                }}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                {categories.map((c) => (
                  <option key={c.slug || c.id} value={c.name_en}>
                    {tCat(c.slug || c.name_en)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Sub-type
              </label>
              <select
                value={formData.subType}
                onChange={(e) => updateField('subType', e.target.value)}
                disabled={subTypes.length === 0}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green disabled:opacity-60 disabled:bg-brand-bg-soft"
              >
                {subTypes.length > 0 ? (
                  subTypes.map((s) => (
                    <option key={s.slug || s.id} value={s.name_en}>
                      {tCat(s.slug || s.name_en)}
                    </option>
                  ))
                ) : (
                  <option value={formData.category}>—</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => updateField('condition', e.target.value)}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="Finished">Finished / Titled</option>
                <option value="Under construction">Under construction</option>
                <option value="Serviced plot">Serviced plot</option>
                <option value="Auction (Cyamunara)">Auction (Cyamunara)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Listing for <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.deal}
                onChange={(e) => updateField('deal', e.target.value)}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="sale">🏷️ For sale</option>
                <option value="rent">🔑 For rent</option>
              </select>
            </div>
          </div>

          {/* 3. Rental terms (if for rent), Price (RWF · monthly rent if for rent), Size (m²) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {isRent && (
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Rental terms (if for rent)
                </label>
                <Input
                  value={formData.rentalTerms}
                  onChange={(e) => updateField('rentalTerms', e.target.value)}
                  placeholder="e.g. 12-month lease · 2 months deposit"
                  className="rounded-[9px] h-11 pl-3 text-sm"
                />
              </div>
            )}

            <div className={isRent ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Price (RWF · monthly rent if for rent) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.priceRwf}
                onChange={(e) => updateField('priceRwf', e.target.value)}
                placeholder={isRent ? 'e.g. 650000' : 'e.g. 18500000'}
                className={`rounded-[9px] h-11 pl-3 text-sm font-semibold ${
                  errors.priceRwf ? errorInputClass : ''
                }`}
              />
              {errors.priceRwf && (
                <p className="text-xs text-red-600 font-medium mt-1">{errors.priceRwf}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Size (m²) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.sizeValue}
                onChange={(e) => updateField('sizeValue', e.target.value)}
                placeholder="e.g. 600"
                className={`rounded-[9px] h-11 pl-3 text-sm ${
                  errors.sizeValue ? errorInputClass : ''
                }`}
              />
              {errors.sizeValue && (
                <p className="text-xs text-red-600 font-medium mt-1">{errors.sizeValue}</p>
              )}
            </div>
          </div>

          {/* 4. Village (cascades from Province) */}
          <div>
            <label className="block text-xs font-semibold text-brand-ink mb-1">
              Village (cascades from Province → District → Sector → Cell → Village){' '}
              <span className="text-red-500">*</span>
            </label>
            <LocationCascade
              key={cascadeKey}
              deepest="village"
              invalid={!!errors.villageId}
              onChange={setLocation}
            />
            {errors.villageId && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.villageId}</p>
            )}
          </div>

          {/* 5. UPI number & Ownership proof (admins only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                UPI number
              </label>
              <Input
                value={formData.upiNumber}
                onChange={(e) => updateField('upiNumber', e.target.value)}
                placeholder="1/02/09/04/432"
                className="rounded-[9px] h-11 pl-3 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Ownership proof (admins only)
              </label>
              <label className="h-11 px-3 rounded-[9px] border border-brand-line bg-brand-bg-soft/40 flex items-center justify-between cursor-pointer hover:border-brand-green">
                <span className="text-xs text-brand-ink-soft truncate flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-green shrink-0" />
                  {formData.ownershipDoc
                    ? formData.ownershipDoc.name
                    : 'Upload land title / mandate (private)'}
                </span>
                <span className="text-xs font-bold text-brand-green shrink-0 ml-2">Browse</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => updateField('ownershipDoc', e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 6. Photos (min 3) */}
          <div>
            <label className="block text-xs font-semibold text-brand-ink mb-1">
              Photos (min 3 · first photo is cover) <span className="text-red-500">*</span>
            </label>
            <div
              className={`p-4 border border-dashed rounded-[10px] bg-brand-bg-soft/30 ${
                errors.photos ? 'border-red-500' : 'border-brand-line'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-brand-line rounded-[9px] text-xs font-semibold text-brand-ink shadow-2xs hover:border-brand-green hover:text-brand-green transition-all">
                  <Upload className="w-3.5 h-3.5 text-brand-green" />
                  <span>Select property photos (min 3)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotosSelect}
                    className="hidden"
                  />
                </label>
                <span className="text-xs font-semibold text-brand-ink-soft">
                  {formData.photos.length} / 3 minimum uploaded
                </span>
              </div>

              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {photoPreviews.map((url, i) => (
                    <div
                      key={url}
                      className="relative h-20 rounded-[9px] overflow-hidden border border-brand-line"
                    >
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-brand-green text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhotoAt(i)}
                        className="absolute top-1 right-1 p-0.5 bg-black/65 text-white rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.photos && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.photos}</p>
            )}
          </div>

          {/* 7. Owner name (hidden) & Owner phone (hidden · unlock fee) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-[10px] bg-brand-bg-soft/50 border border-brand-line">
            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Owner name (hidden)
              </label>
              <Input
                value={formData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                placeholder="e.g. Mugisha Alex"
                className="rounded-[9px] h-11 pl-3 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                <Phone className="w-3.5 h-3.5 inline mr-1 text-brand-green" />
                Owner phone (hidden · {Number(ownerUnlockFee).toLocaleString()} RWF unlock)
              </label>
              <Input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => updateField('ownerPhone', e.target.value)}
                placeholder="078..."
                className="rounded-[9px] h-11 pl-3 text-sm bg-white"
              />
            </div>
          </div>

          {/* 8. ⭐ List as VIP exclusive deal */}
          <div className="p-4 rounded-[12px] bg-[#FFFDF2] border border-[#D3B42B] space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(formData.isVip)}
                onChange={(e) => updateField('isVip', e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-[#007A66] cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-brand-ink leading-relaxed">
                <strong>⭐ List as VIP exclusive deal.</strong> Shown only to VIP subscribers for{' '}
                {settings?.vipDays || 7} days, then public. Use for discounted, discreet or
                pre-launch sales. Admin verifies the discount before approving.
              </span>
            </label>

            {formData.isVip && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Normal public price (RWF · before VIP discount)
                  </label>
                  <Input
                    type="number"
                    value={formData.vipWasPriceRwf}
                    onChange={(e) => updateField('vipWasPriceRwf', e.target.value)}
                    placeholder="e.g. 24000000"
                    className="rounded-[9px] h-10 pl-3 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Why it&apos;s discounted (shown to VIP members)
                  </label>
                  <Input
                    value={formData.vipReason}
                    onChange={(e) => updateField('vipReason', e.target.value)}
                    placeholder="e.g. Owner relocating — quick sale within 30 days"
                    className="rounded-[9px] h-10 pl-3 text-sm bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {errors.form && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errors.form}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-5 sm:p-6 border-t border-brand-line flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-[9px] h-11"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="default"
            className="rounded-[9px] font-semibold h-11 px-6 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting…</span>
              </>
            ) : (
              <>
                <span>Submit for admin approval</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};