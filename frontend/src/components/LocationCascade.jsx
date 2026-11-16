// src/components/LocationCascade.jsx
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { locationsApi } from "../api/locations";

const LEVELS = [
  { key: "province", label: "Province", parent: null },
  { key: "district", label: "District", parent: "province" },
  { key: "sector", label: "Sector", parent: "district" },
  { key: "cell", label: "Cell", parent: "sector" },
  { key: "village", label: "Village", parent: "cell" },
];

// ---- Mock fallback: used ONLY when the API call fails or returns nothing.
// Remove once the locations integration is done. ----
const MOCK_PROVINCES = [
  { id: "kigali", name: "Kigali City" },
  { id: "northern", name: "Northern Province" },
  { id: "southern", name: "Southern Province" },
  { id: "eastern", name: "Eastern Province" },
  { id: "western", name: "Western Province" },
];

const MOCK_CHILDREN = {
  kigali: [
    { id: "gasabo", name: "Gasabo" },
    { id: "kicukiro", name: "Kicukiro" },
    { id: "nyarugenge", name: "Nyarugenge" },
  ],
  gasabo: [
    { id: "kacyiru", name: "Kacyiru" },
    { id: "remera", name: "Remera" },
    { id: "kimironko", name: "Kimironko" },
  ],
  kimironko: [
    { id: "bibare", name: "Bibare" },
    { id: "kibagabaga", name: "Kibagabaga" },
    { id: "nyagatovu", name: "Nyagatovu" },
  ],
};

// Anything without explicit mock data gets generic placeholders so every
// branch can be walked down to the village while prototyping.
const mockChildren = (id, nextLabel) =>
  MOCK_CHILDREN[id] || [
    { id: `${id}-a`, name: `${nextLabel} A` },
    { id: `${id}-b`, name: `${nextLabel} B` },
  ];

const withFallback = async (apiCall, fallback) => {
  try {
    const res = await apiCall();
    const data = res?.data;
    return data && data.length > 0 ? data : fallback;
  } catch {
    return fallback;
  }
};

const toItems = (list, placeholder) => {
  const map = { "": placeholder };
  (list || []).forEach((o) => {
    map[o.id] = o.name;
  });
  return map;
};

const triggerClass =
  "w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-brand-bg-soft";

/**
 * Cascading location picker built on the shadcn Select.
 * Same API as before:
 *   onChange({ locationId, province, district, sector, cell, village, selected })
 * `required` is accepted for compatibility but Base UI Select has no native
 * form validation, so the parent form must check the value itself.
 * `invalid` outlines the first select in red.
 */
export const LocationCascade = ({
  deepest = "village",
  required = false, // eslint-disable-line no-unused-vars
  invalid = false,
  onChange,
  className = "",
  singleColumn = false,
}) => {
  const stopIndex = LEVELS.findIndex((level) => level.key === deepest);
  const visible = LEVELS.slice(0, stopIndex + 1);

  const [options, setOptions] = useState({
    province: [],
    district: [],
    sector: [],
    cell: [],
    village: [],
  });
  const [selected, setSelected] = useState({
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });

  useEffect(() => {
    let cancelled = false;
    withFallback(() => locationsApi.provinces(), MOCK_PROVINCES).then((data) => {
      if (!cancelled) setOptions((prev) => ({ ...prev, province: data }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const emit = (nextSelected, nextOptions) => {
    const deepestSelected = [...visible]
      .reverse()
      .find((level) => nextSelected[level.key]);
    const id = deepestSelected ? nextSelected[deepestSelected.key] : "";
    const names = {};
    visible.forEach((level) => {
      const list = (nextOptions || options)[level.key] || [];
      const match = list.find((item) => item.id === nextSelected[level.key]);
      names[level.key] = match?.name || "";
    });
    onChange?.({ locationId: id, ...names, selected: nextSelected });
  };

  const handleSelect = async (levelKey, id) => {
    const levelIndex = visible.findIndex((level) => level.key === levelKey);

    // Compute the full next state before any setState call (avoids stale closures)
    const nextSelected = { ...selected, [levelKey]: id };
    visible.slice(levelIndex + 1).forEach((level) => {
      nextSelected[level.key] = "";
    });

    const nextOptions = { ...options };
    visible.slice(levelIndex + 1).forEach((level) => {
      nextOptions[level.key] = [];
    });

    setSelected(nextSelected);
    setOptions(nextOptions);
    emit(nextSelected, nextOptions);

    const nextLevel = visible[levelIndex + 1];
    if (!id || !nextLevel) return;

    const data = await withFallback(
      () => locationsApi.children(id),
      mockChildren(id, nextLevel.label)
    );
    setOptions((prev) => ({ ...prev, [nextLevel.key]: data }));
  };

  return (
    <div className={className}>
      <div
        className={
          singleColumn
            ? "flex flex-col gap-2.5"
            : "grid grid-cols-1 sm:grid-cols-2 gap-3"
        }
      >
        {visible.map((level, index) => {
          const parent = visible[index - 1];
          const disabled = Boolean(parent && !selected[parent.key]);
          const placeholder = disabled
            ? `Select ${parent.label} first`
            : `Select ${level.label}`;
          const list = options[level.key] || [];

          return (
            <div key={level.key}>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                {level.label}
              </label>
              <Select
                value={selected[level.key]}
                onValueChange={(v) => handleSelect(level.key, v ?? "")}
                items={toItems(list, placeholder)}
                disabled={disabled}
              >
                <SelectTrigger
                  disabled={disabled}
                  className={`${triggerClass} ${
                    invalid && index === 0 && !selected.province
                      ? "border-red-500 ring-1 ring-red-500/20"
                      : ""
                  }`}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  align="start"
                  sideOffset={6}
                  className="rounded-[9px] max-h-60"
                >
                  <SelectItem value="">{placeholder}</SelectItem>
                  {list.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
};