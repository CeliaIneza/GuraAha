import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { LocationCascade } from "../LocationCascade";
import { listingsApi } from "../../api/listings";
import { Upload, X, Phone, ArrowRight, Loader2, AlertTriangle } from "lucide-react";

const typeItems = { land: "Land", plot: "Plot", house: "House" };
const unitItems = {
  sqm: "Square Meters (m²)",
  ha: "Hectares (ha)",
  ares: "Ares",
};

const selectTriggerClass =
  "w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3";

const errorInputClass = "border-red-500 ring-1 ring-red-500/20";

const emptyForm = {
  titleEn: "",
  titleRw: "",
  titleFr: "",
  descriptionEn: "",
  descriptionRw: "",
  descriptionFr: "",
  type: "land",
  priceRwf: "",
  sizeValue: "",
  sizeUnit: "sqm",
  villageId: "",
  locationComplete: false,
  upiNumber: "",
  ownerName: "",
  ownerPhone: "",
  coverPhoto: null,
  extraPhotos: [],
};

// Form hook: collects, validates and submits the new-property form
export function useAddPropertyForm(onSuccess) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [extraPreviews, setExtraPreviews] = useState([]);
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
    if (["titleEn", "titleRw", "titleFr"].includes(field)) clearError("title");
  };

  const setLocation = ({ locationId, selected }) => {
    setFormData((prev) => ({
      ...prev,
      villageId: locationId,
      locationComplete: !!selected?.village,
    }));
    clearError("villageId");
  };

  const setCover = (file) => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setFormData((prev) => ({ ...prev, coverPhoto: file }));
    setCoverPreview(file ? URL.createObjectURL(file) : null);
    clearError("coverPhoto");
  };

  const setExtras = (files) => {
    extraPreviews.forEach((u) => URL.revokeObjectURL(u));
    setFormData((prev) => ({ ...prev, extraPhotos: files }));
    setExtraPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const validate = () => {
    const e = {};
    if (!(formData.titleEn.trim() || formData.titleRw.trim() || formData.titleFr.trim())) {
      e.title = "Add a title in at least one language";
    }
    if (!formData.priceRwf || Number(formData.priceRwf) <= 0) {
      e.priceRwf = "Enter a valid price";
    }
    if (!formData.sizeValue || Number(formData.sizeValue) <= 0) {
      e.sizeValue = "Enter a valid size";
    }
    if (!formData.villageId || !formData.locationComplete) {
      e.villageId = "Select the location down to the village";
    }
    if (!formData.coverPhoto) {
      e.coverPhoto = "A cover photo is required";
    }
    if (!formData.ownerPhone.trim()) {
      e.ownerPhone = "Owner phone number is required. Buyers pay to unlock this contact.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    extraPreviews.forEach((u) => URL.revokeObjectURL(u));
    setFormData(emptyForm);
    setCoverPreview(null);
    setExtraPreviews([]);
    setErrors({});
    setCascadeKey((n) => n + 1);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { data } = await listingsApi.create({
        villageId: formData.villageId,
        type: formData.type,
        titleEn: formData.titleEn || undefined,
        titleRw: formData.titleRw || undefined,
        titleFr: formData.titleFr || undefined,
        descriptionEn: formData.descriptionEn || undefined,
        descriptionRw: formData.descriptionRw || undefined,
        descriptionFr: formData.descriptionFr || undefined,
        priceRwf: Number(formData.priceRwf),
        sizeValue: Number(formData.sizeValue),
        sizeUnit: formData.sizeUnit,
        upiNumber: formData.upiNumber || undefined,
        ownerName: formData.ownerName || undefined,
        ownerPhone: formData.ownerPhone || undefined,
      });

      if (formData.coverPhoto) {
        await listingsApi.addPhoto(data.id, formData.coverPhoto, 0);
      }
      await Promise.all(
        (formData.extraPhotos || []).map((file, idx) =>
          listingsApi.addPhoto(data.id, file, idx + 1)
        )
      );

      const { data: mine } = await listingsApi.getMine();
      resetForm();
      onSuccess?.(mine || []);
    } catch (err) {
      setErrors({ form: err.message || "Failed to submit property listing." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    coverPreview,
    extraPreviews,
    cascadeKey,
    updateField,
    setLocation,
    setCover,
    setExtras,
    handleSubmit,
  };
}

const Field = ({ label, required, hint, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-brand-ink">
      {label}
      {required && <span className="text-red-500"> *</span>}
      {hint && <span className="text-xs font-normal text-brand-ink-soft"> {hint}</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
  </div>
);

export const AddPropertyTab = ({ onCancel, onSuccess }) => {
  const {
    formData,
    errors,
    isSubmitting,
    coverPreview,
    extraPreviews,
    cascadeKey,
    updateField,
    setLocation,
    setCover,
    setExtras,
    handleSubmit,
  } = useAddPropertyForm(onSuccess);

  return (
    <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-6 text-center flex flex-col items-center">
        <CardTitle className="text-xl sm:text-2xl font-bold text-brand-ink">
          Add Property Listing
        </CardTitle>
        <CardDescription className="text-sm text-brand-ink-soft leading-relaxed mt-1">
          Submit verified land or house information. Title deeds and owner contact will be
          audited before publishing.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
          {/* Titles */}
          <Field label="Property Titles" required error={errors.title}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => updateField("titleEn", e.target.value)}
                  placeholder="Title in English"
                  className={`rounded-[9px] h-11 pl-3 text-sm ${errors.title ? errorInputClass : ""}`}
                />
                <span className="text-[11px] text-brand-ink-soft mt-1 block">English</span>
              </div>
              <div>
                <Input
                  value={formData.titleRw}
                  onChange={(e) => updateField("titleRw", e.target.value)}
                  placeholder="Umutwe mu Kinyarwanda"
                  className={`rounded-[9px] h-11 pl-3 text-sm ${errors.title ? errorInputClass : ""}`}
                />
                <span className="text-[11px] text-brand-ink-soft mt-1 block">Kinyarwanda</span>
              </div>
              <div>
                <Input
                  value={formData.titleFr}
                  onChange={(e) => updateField("titleFr", e.target.value)}
                  placeholder="Titre en Français"
                  className={`rounded-[9px] h-11 pl-3 text-sm ${errors.title ? errorInputClass : ""}`}
                />
                <span className="text-[11px] text-brand-ink-soft mt-1 block">Français</span>
              </div>
            </div>
          </Field>

          {/* Descriptions */}
          <Field label="Property Descriptions">
            <div className="space-y-3">
              <Textarea
                value={formData.descriptionEn}
                onChange={(e) => updateField("descriptionEn", e.target.value)}
                rows={2}
                placeholder="Description in English"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  value={formData.descriptionRw}
                  onChange={(e) => updateField("descriptionRw", e.target.value)}
                  rows={2}
                  placeholder="Ibisobanuro mu Kinyarwanda"
                />
                <Textarea
                  value={formData.descriptionFr}
                  onChange={(e) => updateField("descriptionFr", e.target.value)}
                  rows={2}
                  placeholder="Description en Français"
                />
              </div>
            </div>
          </Field>

          {/* Type & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Property Type" required>
              <Select
                value={formData.type}
                onValueChange={(v) => updateField("type", v ?? "land")}
                items={typeItems}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Land" />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  align="start"
                  sideOffset={6}
                  className="rounded-[9px]"
                >
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="plot">Plot</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Price (RWF)" required error={errors.priceRwf}>
              <Input
                type="number"
                value={formData.priceRwf}
                onChange={(e) => updateField("priceRwf", e.target.value)}
                placeholder="e.g. 15000000"
                className={`rounded-[9px] h-11 pl-3 text-sm font-semibold ${
                  errors.priceRwf ? errorInputClass : ""
                }`}
              />
            </Field>
          </div>

          {/* Size & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Measurement Size" required error={errors.sizeValue}>
              <Input
                type="number"
                value={formData.sizeValue}
                onChange={(e) => updateField("sizeValue", e.target.value)}
                placeholder="e.g. 600"
                className={`rounded-[9px] h-11 pl-3 text-sm ${
                  errors.sizeValue ? errorInputClass : ""
                }`}
              />
            </Field>

            <Field label="Unit of Measurement">
              <Select
                value={formData.sizeUnit}
                onValueChange={(v) => updateField("sizeUnit", v ?? "sqm")}
                items={unitItems}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Square Meters (m²)" />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  align="start"
                  sideOffset={6}
                  className="rounded-[9px]"
                >
                  <SelectItem value="sqm">Square Meters (m²)</SelectItem>
                  <SelectItem value="ha">Hectares (ha)</SelectItem>
                  <SelectItem value="ares">Ares</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Location */}
          <Field
            label="Location (Province down to Village)"
            required
            error={errors.villageId}
          >
            <LocationCascade
              key={cascadeKey}
              deepest="village"
              invalid={!!errors.villageId}
              onChange={setLocation}
            />
          </Field>

          {/* UPI */}
          <Field label="UPI Number (Unique Parcel Identifier)">
            <Input
              value={formData.upiNumber}
              onChange={(e) => updateField("upiNumber", e.target.value)}
              placeholder="e.g. 1/02/09/04/432"
              className="rounded-[9px] h-11 pl-3 text-sm font-mono"
            />
          </Field>

          {/* Cover photo */}
          <Field label="Cover Photo" required error={errors.coverPhoto}>
            <div
              className={`p-4 border border-dashed rounded-[9px] bg-brand-bg-soft/30 hover:border-brand-green/60 transition-colors ${
                errors.coverPhoto ? "border-red-500" : "border-brand-line"
              }`}
            >
              <label className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer">
                <span className="w-10 h-10 rounded-[9px] bg-white border border-brand-line flex items-center justify-center text-brand-green shrink-0">
                  <Upload className="w-5 h-5 text-brand-green" />
                </span>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-semibold text-brand-ink block">
                    Click to upload property cover image
                  </span>
                  <span className="text-[11px] text-brand-ink-soft">
                    JPEG, PNG or WEBP (high-resolution recommended)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCover(file);
                  }}
                  className="hidden"
                />
              </label>

              {coverPreview && (
                <div className="mt-3 relative w-full sm:w-60 h-36 rounded-[9px] overflow-hidden border border-brand-line">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCover(null)}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-[6px]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </Field>

          {/* Additional photos */}
          <Field label="Additional Photos" hint="(up to 4, optional)">
            <div className="p-4 border border-dashed border-brand-line rounded-[9px] bg-brand-bg-soft/30">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-brand-line rounded-[9px] text-xs font-semibold text-brand-ink shadow-xs hover:border-brand-green hover:text-brand-green transition-all">
                <Upload className="w-3.5 h-3.5 text-brand-green" />
                <span>Select multiple images</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) =>
                    setExtras(Array.from(e.target.files || []).slice(0, 4))
                  }
                  className="hidden"
                />
              </label>

              {extraPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {extraPreviews.map((url, i) => (
                    <div
                      key={url}
                      className="relative h-20 rounded-[9px] overflow-hidden border border-brand-line"
                    >
                      <img
                        src={url}
                        alt={`Extra ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Owner contact */}
          <div className="p-4 rounded-[9px] bg-brand-bg-soft/40 border border-brand-line space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-green" />
              <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                Owner Direct Contact (Protected)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Owner Full Name" hint="(Private)">
                <Input
                  value={formData.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  placeholder="e.g. Mugisha Alex"
                  className="rounded-[9px] h-11 pl-3 text-sm bg-white"
                />
              </Field>

              <Field label="Owner Phone Number" required error={errors.ownerPhone}>
                <Input
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) => updateField("ownerPhone", e.target.value)}
                  placeholder="0788 XXX XXX"
                  className={`rounded-[9px] h-11 pl-3 text-sm bg-white ${
                    errors.ownerPhone ? errorInputClass : ""
                  }`}
                />
                {!errors.ownerPhone && (
                  <p className="text-[11px] text-brand-ink-soft">
                    Buyers pay to unlock this verified contact
                  </p>
                )}
              </Field>
            </div>
          </div>

          {/* Form-level error (API failure) */}
          {errors.form && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errors.form}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 sm:p-8 pt-5 border-t border-brand-line/60 flex items-center justify-between">
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
            className="rounded-[9px] font-semibold h-11 px-6 shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting…</span>
              </>
            ) : (
              <>
                <span>Submit for Admin Approval</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};