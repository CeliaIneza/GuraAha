import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { locationsApi } from '../../api/locations';
import { MapPin, Edit2, Plus, X } from 'lucide-react';
import {
  Panel,
  RefreshButton,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from './AdminShared';

export const LocationsTab = ({ showToast }) => {
  const { areaHighlights, refreshAreaHighlights } = useApp();
  const [districtsList, setDistrictsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [textEn, setTextEn] = useState('');
  const [textRw, setTextRw] = useState('');
  const [textFr, setTextFr] = useState('');

  // Add district form
  const [newProvince, setNewProvince] = useState('Kigali City');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newHighlights, setNewHighlights] = useState('');

  const loadLocations = async () => {
    setLoading(true);
    try {
      const res = await locationsApi.getAreaHighlights();
      const payload = res?.data;
      if (Array.isArray(payload?.districts) && payload.districts.length > 0) {
        setDistrictsList(payload.districts);
      } else if (Array.isArray(payload) && payload.length > 0) {
        setDistrictsList(payload);
      } else if (Array.isArray(areaHighlights)) {
        setDistrictsList(areaHighlights);
      }
    } catch {
      if (Array.isArray(areaHighlights)) {
        setDistrictsList(areaHighlights);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [areaHighlights]);

  const toText = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) return val.join('\n');
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join('\n');
      } catch {
        return val;
      }
      return val;
    }
    return '';
  };

  const openEdit = (item) => {
    setEditingArea(item);
    setTextEn(toText(item.highlights_en));
    setTextRw(toText(item.highlights_rw));
    setTextFr(toText(item.highlights_fr));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingArea) return;
    try {
      await locationsApi.updateAreaHighlight(editingArea.district_name, {
        provinceName: editingArea.province_name || 'Kigali City',
        highlightsEn: textEn.trim(),
        highlightsRw: textRw.trim() || textEn.trim(),
        highlightsFr: textFr.trim() || textEn.trim(),
      });
      await refreshAreaHighlights();
      await loadLocations();
      setEditingArea(null);
      showToast(`Updated area highlights for ${editingArea.district_name}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update area highlights');
    }
  };

  const handleAddDistrict = async (e) => {
    e.preventDefault();
    const dName = newDistrictName.trim();
    if (!dName) {
      showToast('Please enter a district name.');
      return;
    }
    const text =
      newHighlights.trim() || `Verified land & property opportunities in ${dName}.`;
    try {
      await locationsApi.addDistrict(newProvince, dName).catch(() => {});
      await locationsApi.updateAreaHighlight(dName, {
        provinceName: newProvince,
        highlightsEn: text,
        highlightsRw: text,
        highlightsFr: text,
      });
      setNewDistrictName('');
      setNewHighlights('');
      await refreshAreaHighlights();
      await loadLocations();
      showToast(`Saved area page highlights for ${dName}.`);
    } catch (err) {
      showToast(err.message || 'Failed to save district page');
    }
  };

  return (
    <Panel
      icon={MapPin}
      title={`Locations & Area Pages (${districtsList.length})`}
      subtitle="Manage districts and the 'Area investment highlights' displayed on property detail pages"
      actions={<RefreshButton onClick={loadLocations} loading={loading} />}
    >
      <div className="space-y-6">
        {/* Add / Update District Form */}
        <form
          onSubmit={handleAddDistrict}
          className="p-4 rounded-[12px] bg-brand-bg-soft/60 border border-brand-line space-y-3"
        >
          <div className="text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
            + Add or Update District Area Page
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={newProvince}
              onChange={(e) => setNewProvince(e.target.value)}
              className="h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
            >
              <option value="Kigali City">Kigali City</option>
              <option value="Northern Province">Northern Province</option>
              <option value="Southern Province">Southern Province</option>
              <option value="Eastern Province">Eastern Province</option>
              <option value="Western Province">Western Province</option>
            </select>
            <input
              type="text"
              value={newDistrictName}
              onChange={(e) => setNewDistrictName(e.target.value)}
              placeholder="District name (e.g. Rubavu)"
              className="h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
            />
            <input
              type="text"
              value={newHighlights}
              onChange={(e) => setNewHighlights(e.target.value)}
              placeholder="Area investment highlights..."
              className="h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save District Page</span>
            </button>
          </div>
        </form>

        {/* Exact Table Columns: District | Province | Live listings | Area investment highlights | Actions */}
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[820px]`}>
            <thead className={theadClass}>
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Province</th>
                <th className="py-3 px-4">Live listings</th>
                <th className="py-3 px-4">Area investment highlights</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {districtsList.map((item) => {
                const highlightPreview =
                  toText(item.highlights_en) ||
                  'Rapid growth corridor: tarmac feeder roads, fibre coverage, 10 min to markets and schools.';
                return (
                  <tr key={item.district_id || item.district_name} className={rowClass}>
                    <td className="py-3 px-4 font-bold text-brand-ink">
                     {item.district_name}
                    </td>
                    <td className="py-3 px-4 text-xs text-brand-ink-soft">
                      {item.province_name || 'Rwanda'}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-brand-green-dark">
                      {Number(item.live_listings_count ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-xs text-brand-ink-soft max-w-md">
                      <div className="line-clamp-2">{highlightPreview}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="h-8 px-3 rounded-[7px] border border-brand-line bg-white hover:bg-brand-bg-soft text-xs font-semibold text-brand-ink inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit area page</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingArea && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] border border-brand-line p-6 w-full max-w-lg shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingArea(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-brand-bg-soft text-brand-ink-soft cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-brand-ink mb-4">
              Edit Area Highlights {editingArea.district_name}
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Highlights in English
                </label>
                <textarea
                  rows={3}
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                  className="w-full p-3 rounded-[9px] border border-brand-line text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Highlights in Kinyarwanda
                </label>
                <textarea
                  rows={3}
                  value={textRw}
                  onChange={(e) => setTextRw(e.target.value)}
                  className="w-full p-3 rounded-[9px] border border-brand-line text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Highlights in French
                </label>
                <textarea
                  rows={3}
                  value={textFr}
                  onChange={(e) => setTextFr(e.target.value)}
                  className="w-full p-3 rounded-[9px] border border-brand-line text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer"
                >
                  Save Highlights
                </button>
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  className="h-10 px-5 rounded-[9px] border border-brand-line text-brand-ink font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Panel>
  );
};
