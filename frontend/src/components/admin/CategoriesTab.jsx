import React, { useState } from 'react';
import { categoriesApi } from '../../api/categories';
import { useApp } from '../../context/AppContext';
import { Layers, Plus, Trash2, Edit2 } from 'lucide-react';
import { Panel, RefreshButton } from './AdminShared';

export const CategoriesTab = ({ showToast }) => {
  const { categories, refreshCategories } = useApp();
  const [loading, setLoading] = useState(false);

  // Add Category form
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatRw, setNewCatRw] = useState('');
  const [newCatFr, setNewCatFr] = useState('');

  // Add Sub-type form per category
  const [subInputs, setSubInputs] = useState({});

  const handleRefresh = async () => {
    setLoading(true);
    await refreshCategories();
    setLoading(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const nameEn = newCatEn.trim();
    if (!nameEn) {
      showToast('Please enter a category name in English.');
      return;
    }
    try {
      await categoriesApi.create({
        nameEn,
        nameRw: newCatRw.trim() || nameEn,
        nameFr: newCatFr.trim() || nameEn,
      });
      setNewCatEn('');
      setNewCatRw('');
      setNewCatFr('');
      await refreshCategories();
      showToast(`Category "${nameEn}" added to database.`);
    } catch (err) {
      showToast(err.message || 'Failed to create category');
    }
  };

  const handleEditCategory = async (cat) => {
    const nextEn = window.prompt('Category name (English):', cat.name_en);
    if (!nextEn || !nextEn.trim()) return;
    const nextRw = window.prompt('Category name (Kinyarwanda):', cat.name_rw || nextEn);
    const nextFr = window.prompt('Category name (French):', cat.name_fr || nextEn);
    try {
      await categoriesApi.update(cat.id, {
        nameEn: nextEn.trim(),
        nameRw: (nextRw || nextEn).trim(),
        nameFr: (nextFr || nextEn).trim(),
      });
      await refreshCategories();
      showToast('Category updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name_en}" and its sub-types?`)) return;
    try {
      await categoriesApi.delete(cat.id);
      await refreshCategories();
      showToast(`Category "${cat.name_en}" deleted.`);
    } catch (err) {
      showToast(err.message || 'Failed to delete category');
    }
  };

  const handleAddSubType = async (cat) => {
    const val = (subInputs[cat.id] || '').trim();
    if (!val) {
      showToast('Enter a sub-type name first.');
      return;
    }
    try {
      await categoriesApi.addSubtype(cat.id, {
        nameEn: val,
        nameRw: val,
        nameFr: val,
      });
      setSubInputs((prev) => ({ ...prev, [cat.id]: '' }));
      await refreshCategories();
      showToast(`Sub-type "${val}" added to ${cat.name_en}.`);
    } catch (err) {
      showToast(err.message || 'Failed to add sub-type');
    }
  };

  const handleDeleteSubType = async (cat, sub) => {
    try {
      await categoriesApi.deleteSubtype(cat.id, sub.id);
      await refreshCategories();
      showToast(`Removed sub-type "${sub.name_en}".`);
    } catch (err) {
      showToast(err.message || 'Failed to remove sub-type');
    }
  };

  return (
    <Panel
      icon={Layers}
      title={`Property Categories & Sub-Types (${categories.length})`}
      subtitle="Stored in PostgreSQL and dynamically reflected across Home, Browse, Blocker Post form, and Admin filters"
      actions={<RefreshButton onClick={handleRefresh} loading={loading} />}
    >
      <div className="space-y-6">
        {/* Add New Category Card */}
        <form
          onSubmit={handleAddCategory}
          className="p-4 rounded-[12px] bg-brand-bg-soft/60 border border-brand-line space-y-3"
        >
          <div className="text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
            + Add New Property Category
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                value={newCatEn}
                onChange={(e) => setNewCatEn(e.target.value)}
                placeholder="e.g. Agricultural"
                className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Name (Kinyarwanda)
              </label>
              <input
                type="text"
                value={newCatRw}
                onChange={(e) => setNewCatRw(e.target.value)}
                placeholder="e.g. Ubuhinzi"
                className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-ink mb-1">
                Name (Français)
              </label>
              <input
                type="text"
                value={newCatFr}
                onChange={(e) => setNewCatFr(e.target.value)}
                placeholder="e.g. Agricole"
                className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </form>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const subs = cat.subtypes || cat.subTypes || [];
            return (
              <div
                key={cat.id || cat.slug}
                className="p-4 rounded-[12px] border border-brand-line bg-white flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-brand-ink">{cat.name_en}</h4>
                      <p className="text-xs text-brand-ink-soft mt-0.5">
                        RW: <span className="font-medium">{cat.name_rw || cat.name_en}</span> · FR:{' '}
                        <span className="font-medium">{cat.name_fr || cat.name_en}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(cat)}
                        className="p-1.5 rounded-lg border border-brand-line hover:bg-brand-bg-soft text-brand-ink-soft hover:text-brand-ink cursor-pointer"
                        title="Rename Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-types pills */}
                  <div className="mt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-brand-ink-soft mb-1.5">
                      Sub-types ({subs.length})
                    </div>
                    {subs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {subs.map((sub) => (
                          <span
                            key={sub.id || sub.slug}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-bg-soft border border-brand-line text-xs font-semibold text-brand-ink"
                          >
                            <span>{sub.name_en}</span>
                            {sub.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSubType(cat, sub)}
                                className="text-brand-ink-soft hover:text-red-600 font-bold cursor-pointer"
                                title="Remove sub-type"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-brand-ink-soft">
                        No sub-types — listings use the category directly.
                      </p>
                    )}
                  </div>
                </div>

                {/* Add Sub-type input */}
                {cat.id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-line">
                    <input
                      type="text"
                      value={subInputs[cat.id] || ''}
                      onChange={(e) =>
                        setSubInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      placeholder={`Add sub-type to ${cat.name_en}…`}
                      className="flex-1 h-9 px-3 rounded-[8px] border border-brand-line text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSubType(cat)}
                      className="h-9 px-3 rounded-[8px] border border-brand-green text-brand-green hover:bg-brand-green hover:text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      + Sub-type
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};
