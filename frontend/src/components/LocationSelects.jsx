import React, { useEffect, useState } from 'react';
import { getLocationChildren, getProvinces } from '../api/locations';

export const LocationSelects = ({
  value,
  onChange,
  depth = 'village',
  required = false,
}) => {
  const levels = ['province', 'district', 'sector', 'cell', 'village'];
  const stopAt = levels.indexOf(depth);

  const [options, setOptions] = useState({
    province: [],
    district: [],
    sector: [],
    cell: [],
    village: [],
  });
  const [selected, setSelected] = useState(value || {});

  useEffect(() => {
    getProvinces()
      .then((res) => setOptions((prev) => ({ ...prev, province: res.data || [] })))
      .catch(() => setOptions((prev) => ({ ...prev, province: [] })));
  }, []);

  const loadChildren = async (parentId, childLevel) => {
    if (!parentId) return;
    try {
      const res = await getLocationChildren(parentId);
      setOptions((prev) => ({ ...prev, [childLevel]: res.data || [] }));
    } catch {
      setOptions((prev) => ({ ...prev, [childLevel]: [] }));
    }
  };

  const handleSelect = async (level, id) => {
    const levelIndex = levels.indexOf(level);
    const next = { ...selected, [level]: id };
    for (let i = levelIndex + 1; i < levels.length; i += 1) {
      next[levels[i]] = '';
    }
    setSelected(next);

    const deepest = [...levels].reverse().find((key) => next[key]);
    onChange?.({
      ...next,
      locationId: deepest ? next[deepest] : '',
    });

    const childLevel = levels[levelIndex + 1];
    if (childLevel && levelIndex < stopAt && id) {
      await loadChildren(id, childLevel);
    }
  };

  const visible = levels.slice(0, stopAt + 1);
  const labels = {
    province: 'Province',
    district: 'District',
    sector: 'Sector',
    cell: 'Cell',
    village: 'Village',
  };

  return (
    <>
      {visible.map((level, index) => (
        <div key={level}>
          <label className="block text-xs font-semibold text-brand-ink-soft mb-1">{labels[level]}</label>
          <select
            value={selected[level] || ''}
            required={required && index === visible.length - 1}
            disabled={index > 0 && !selected[visible[index - 1]]}
            onChange={(e) => handleSelect(level, e.target.value)}
            className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
          >
            <option value="">{`All ${labels[level].toLowerCase()}s`}</option>
            {(options[level] || []).map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      ))}
    </>
  );
};
