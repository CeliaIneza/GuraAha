import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import { partnersApi } from "../../api/partners";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Briefcase, Plus, Edit2, Trash2, Award, X } from "lucide-react";
import {
  Panel,
  RefreshButton,
  LoadingState,
  EmptyState,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from "./AdminShared";

const PARTNER_TYPES = ["surveyor", "notary", "engineer", "valuer", "legal"];
const typeItems = Object.fromEntries(
  PARTNER_TYPES.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)])
);

const emptyForm = {
  name: "",
  type: "surveyor",
  phone: "",
  email: "",
  descriptionEn: "",
  isCertified: true,
};

const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-brand-ink mb-1">
    {children}
    {required && <span className="text-red-500"> *</span>}
  </label>
);

export const PartnersTab = ({ showToast }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const loadPartners = async () => {
    setLoading(true);
    try {
      const res = await partnersApi.getAll();
      setPartners(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      showToast(err.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const openAdd = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingPartner(p);
    setForm({
      name: p.name || "",
      type: p.type || "surveyor",
      phone: p.phone || "",
      email: p.email || "",
      descriptionEn: p.description_en || p.descriptionEn || "",
      isCertified: p.is_certified ?? p.isCertified ?? true,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        isCertified: Boolean(form.isCertified),
      };
      if (editingPartner) {
        await adminApi.updatePartner(editingPartner.id, payload);
        showToast("Partner updated.");
      } else {
        await adminApi.createPartner(payload);
        showToast("Partner added.");
      }
      setIsFormOpen(false);
      loadPartners();
    } catch (err) {
      showToast(err.message || "Failed to save partner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await adminApi.deletePartner(p.id);
      showToast("Partner deleted.");
      loadPartners();
    } catch (err) {
      showToast(err.message || "Failed to delete");
    }
  };

  return (
    <Panel
      icon={Briefcase}
      title="Certified Partners"
      subtitle="Surveyors, notaries, and engineers available on the platform"
      actions={
        <>
          <Button onClick={openAdd} size="sm" className="rounded-[9px]">
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
          <RefreshButton onClick={loadPartners} loading={loading} />
        </>
      }
    >
      {loading && partners.length === 0 ? (
        <LoadingState />
      ) : partners.length > 0 ? (
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead className={theadClass}>
              <tr>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {partners.map((p) => (
                <tr key={p.id} className={rowClass}>
                  <td className="py-3 px-4 font-semibold text-brand-ink">
                    {p.name}
                    <div className="text-xs text-brand-ink-soft font-normal truncate max-w-xs">
                      {p.description_en || p.descriptionEn}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium capitalize text-brand-ink-soft">
                    {p.type}
                  </td>
                  <td className="py-3 px-4 text-xs text-brand-ink-soft">
                    {p.phone && <div>{p.phone}</div>}
                    {p.email && <div>{p.email}</div>}
                  </td>
                  <td className="py-3 px-4">
                    {p.is_certified ?? p.isCertified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <Award className="w-3 h-3" /> Certified
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(p)}
                        className="rounded-[9px]"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(p)}
                        className="rounded-[9px]"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No partners yet. Click "Add Partner" to register one.</EmptyState>
      )}

      {/* Add / edit modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[9px] border border-brand-line p-6 w-full max-w-md shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-[9px] hover:bg-brand-bg-soft text-brand-ink-soft hover:text-brand-ink"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-brand-ink mb-4">
              {editingPartner ? "Edit Partner" : "Add New Partner"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label required>Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Kigali Land Surveyors Ltd"
                  className="rounded-[9px] h-11 pl-3 text-sm"
                />
              </div>

              <div>
                <Label required>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setField("type", v ?? "surveyor")}
                  items={typeItems}
                >
                  <SelectTrigger className="w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white px-3">
                    <SelectValue placeholder="Surveyor" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="start"
                    sideOffset={6}
                    className="rounded-[9px]"
                  >
                    {PARTNER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeItems[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="0788..."
                    className="rounded-[9px] h-11 pl-3 text-sm"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="partner@example.com"
                    className="rounded-[9px] h-11 pl-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label>Description (EN)</Label>
                <Textarea
                  value={form.descriptionEn}
                  onChange={(e) => setField("descriptionEn", e.target.value)}
                  rows={2}
                  placeholder="Services offered..."
                />
              </div>

              <label
                htmlFor="certifiedCheck"
                className="flex items-center gap-2 pt-1 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id="certifiedCheck"
                  checked={form.isCertified}
                  onChange={(e) => setField("isCertified", e.target.checked)}
                  className="h-4 w-4 rounded-[4px] border-brand-line accent-[#007A66] cursor-pointer"
                />
                <span className="text-xs font-medium text-brand-ink">
                  Certified partner badge
                </span>
              </label>

              <div className="pt-3 flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 rounded-[9px] font-semibold"
                >
                  {submitting
                    ? "Saving…"
                    : editingPartner
                    ? "Save Changes"
                    : "Create Partner"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="h-11 rounded-[9px] px-5"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Panel>
  );
};