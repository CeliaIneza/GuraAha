import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { partnersApi } from '../../api/partners';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Briefcase, Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { RowActions } from './RowActions';
import {
  Panel,
  RefreshButton,
  LoadingState,
  EmptyState,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from './AdminShared';

const PARTNER_TYPES = [
  'SURVEYOR',
  'NOTARY',
  'ENGINEER',
  'ARCHITECT',
  'VALUER',
  'LEGAL_ADVISOR',
  'OTHER',
];

export const RWANDA_30_DISTRICTS = [
  // Kigali City (3)
  'Gasabo',
  'Kicukiro',
  'Nyarugenge',
  // Eastern Province (7)
  'Bugesera',
  'Gatsibo',
  'Kayonza',
  'Kirehe',
  'Ngoma',
  'Nyagatare',
  'Rwamagana',
  // Northern Province (5)
  'Burera',
  'Gakenke',
  'Gicumbi',
  'Musanze',
  'Rulindo',
  // Southern Province (8)
  'Gisagara',
  'Huye',
  'Kamonyi',
  'Muhanga',
  'Nyamagabe',
  'Nyanza',
  'Nyaruguru',
  'Ruhango',
  // Western Province (7)
  'Karongi',
  'Ngororero',
  'Nyabihu',
  'Nyamasheke',
  'Rubavu',
  'Rusizi',
  'Rutsiro',
];

const emptyForm = {
  name: '',
  type: 'SURVEYOR',
  districtName: 'Gasabo',
  certificationNumber: '',
  phone: '',
  email: '',
  descriptionEn: '',
  isCertified: true,
  isActive: true,
};

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
      const list = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setPartners(list);
    } catch (err) {
      showToast(err.message || 'Failed to load partners');
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
      name: p.name || '',
      type: (p.type || 'SURVEYOR').toUpperCase(),
      districtName: p.district_name || p.location_name || 'Gasabo',
      certificationNumber: p.certification_number || '',
      phone: p.phone || '',
      email: p.email || '',
      descriptionEn: p.description_en || p.descriptionEn || '',
      isCertified: p.is_certified ?? p.isCertified ?? true,
      isActive: p.is_active ?? p.isActive ?? true,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: (form.type || 'SURVEYOR').toUpperCase(),
        districtName: form.districtName.trim() || 'Gasabo',
        certificationNumber: form.certificationNumber.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        isCertified: Boolean(form.isCertified),
        isActive: Boolean(form.isActive),
      };
      if (editingPartner) {
        await adminApi.updatePartner(editingPartner.id, payload);
        showToast('Partner updated.');
      } else {
        await adminApi.createPartner(payload);
        showToast('Partner added.');
      }
      setIsFormOpen(false);
      loadPartners();
    } catch (err) {
      showToast(err.message || 'Failed to save partner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisible = async (p) => {
    const currentlyActive = p.is_active ?? p.isActive ?? true;
    try {
      await adminApi.updatePartner(p.id, { isActive: !currentlyActive });
      showToast(
        !currentlyActive
          ? `"${p.name}" is now visible on public Partners page.`
          : `"${p.name}" hidden from public Partners page.`
      );
      loadPartners();
    } catch (err) {
      showToast(err.message || 'Failed to toggle partner visibility');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Permanently delete partner "${p.name}"?`)) return;
    try {
      await adminApi.deletePartner(p.id);
      showToast('Partner deleted.');
      loadPartners();
    } catch (err) {
      showToast(err.message || 'Failed to delete');
    }
  };

  return (
    <Panel
      icon={Briefcase}
      title={`Certified Partners (${partners.length})`}
      subtitle="Surveyors, notaries, engineers, architects and valuers available on the platform"
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
          {/* Exact columns: Partner | Profession | District | Certification | Services | Status | Actions */}
          <table className={`${tableClass} min-w-[900px]`}>
            <thead className={theadClass}>
              <tr>
                <th className="py-3 px-3.5">Partner</th>
                <th className="py-3 px-3.5">Profession</th>
                <th className="py-3 px-3.5">District</th>
                <th className="py-3 px-3.5">Certification</th>
                <th className="py-3 px-3.5">Services</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {partners.map((p) => {
                const isActive = p.is_active ?? p.isActive ?? true;
                return (
                  <tr key={p.id} className={rowClass}>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-brand-ink">{p.name}</div>
                      <div className="text-xs font-mono text-brand-ink-soft">
                        {p.phone || p.email || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-xs font-semibold capitalize text-brand-ink">
                      {(p.type || 'SURVEYOR').toLowerCase().replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3.5 text-xs font-semibold text-brand-green-dark">
                      {p.district_name || p.location_name || 'Gasabo'}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-xs text-brand-ink">
                      {p.certification_number || 'Verified'}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-brand-ink-soft max-w-xs truncate">
                      {p.description_en || p.descriptionEn || '—'}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isActive ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <RowActions
                        label={`Actions for ${p.name}`}
                        actions={[
                          {
                            label: isActive ? 'Hide from public' : 'Show on public page',
                            icon: isActive ? EyeOff : Eye,
                            onClick: () => handleToggleVisible(p),
                          },
                          {
                            label: 'Edit partner',
                            icon: Edit2,
                            onClick: () => openEdit(p),
                          },
                          {
                            label: 'Delete permanently',
                            icon: Trash2,
                            destructive: true,
                            onClick: () => handleDelete(p),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No partners yet. Click &quot;Add Partner&quot; to register one.</EmptyState>
      )}

      {/* Add / Edit modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-brand-line p-6 w-full max-w-md shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-[9px] hover:bg-brand-bg-soft text-brand-ink-soft hover:text-brand-ink cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-brand-ink mb-4">
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Name *
                </label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Eng. Bosco Habimana"
                  className="rounded-[9px] h-10 pl-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Profession *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setField('type', e.target.value)}
                    className="w-full h-10 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium"
                  >
                    {PARTNER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Operating District *
                  </label>
                  <select
                    value={form.districtName}
                    onChange={(e) => setField('districtName', e.target.value)}
                    className="w-full h-10 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium"
                  >
                    {RWANDA_30_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Certification No.
                  </label>
                  <Input
                    value={form.certificationNumber}
                    onChange={(e) => setField('certificationNumber', e.target.value)}
                    placeholder="e.g. RLMUA #214"
                    className="rounded-[9px] h-10 pl-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="0788..."
                    className="rounded-[9px] h-10 pl-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Services Offered
                </label>
                <Textarea
                  value={form.descriptionEn}
                  onChange={(e) => setField('descriptionEn', e.target.value)}
                  rows={2}
                  placeholder="e.g. Land measurement, UPI boundary verification..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 rounded-[9px] font-semibold cursor-pointer"
                >
                  {submitting
                    ? 'Saving…'
                    : editingPartner
                    ? 'Save Changes'
                    : 'Create Partner'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 rounded-[9px] px-5 cursor-pointer"
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