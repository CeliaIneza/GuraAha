import React, { useEffect, useState } from 'react';
import { locationsApi } from '../api/locations';

const LEVELS = [
  { key: 'province', label: 'Province', parent: null },
  { key: 'district', label: 'District', parent: 'province' },
  { key: 'sector', label: 'Sector', parent: 'district' },
  { key: 'cell', label: 'Cell', parent: 'sector' },
  { key: 'village', label: 'Village', parent: 'cell' },
];

export const LocationCascade = ({
  deepest = 'village',
  required = false,
  onChange,
  className = '',
  singleColumn = false,
}) => {
  const stopIndex = LEVELS.findIndex((level) => level.key === deepest);
  const visible = LEVELS.slice(0, stopIndex + 1);

  const [options, setOptions] = useState({
    province: [], district: [], sector: [], cell: [], village: [],
  });
  const [selected, setSelected] = useState({
    province: '', district: '', sector: '', cell: '', village: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    locationsApi
      .provinces()
      .then(({ data }) => setOptions((prev) => ({ ...prev, province: data || [] })))
      .catch((err) => setError(err.message));
  }, []);

  const emit = (nextSelected, nextOptions) => {
    const deepestSelected = [...visible].reverse().find((level) => nextSelected[level.key]);
    const id = deepestSelected ? nextSelected[deepestSelected.key] : '';
    const names = {};
    visible.forEach((level) => {
      const list = (nextOptions || options)[level.key] || [];
      const match = list.find((item) => item.id === nextSelected[level.key]);
      names[level.key] = match?.name || '';
    });
    onChange?.({ locationId: id, ...names, selected: nextSelected });
  };

  const handleSelect = async (levelKey, id) => {
    const levelIndex = visible.findIndex((level) => level.key === levelKey);

    // Compute full next state before any setState call to avoid stale closure issues
    const nextSelected = { ...selected, [levelKey]: id };
    visible.slice(levelIndex + 1).forEach((level) => { nextSelected[level.key] = ''; });

    const nextOptions = { ...options };
    visible.slice(levelIndex + 1).forEach((level) => { nextOptions[level.key] = []; });

    setSelected(nextSelected);
    setOptions(nextOptions);
    emit(nextSelected, nextOptions);

    const nextLevel = visible[levelIndex + 1];
    if (!id || !nextLevel) return;

    try {
      const { data } = await locationsApi.children(id);
      // Use functional update to avoid stale options
      setOptions((prev) => ({ ...prev, [nextLevel.key]: data || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={className}>
      <div className={singleColumn ? 'flex flex-col gap-2.5' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
        {visible.map((level, index) => {
          const parent = visible[index - 1];
          const disabled = Boolean(parent && !selected[parent.key]);
          return (
            <div key={level.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                {level.label}
              </label>
              <select
                required={required && level.key === deepest}
                disabled={disabled}
                value={selected[level.key]}
                onChange={(e) => handleSelect(level.key, e.target.value)}
                className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              >
                <option value="">
                  {disabled ? `Select ${parent.label} first` : `Select ${level.label}`}
                </option>
                {options[level.key].map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
};
