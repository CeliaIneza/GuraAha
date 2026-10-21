import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { listingsApi } from "../api/listings";
import { locationsApi } from "../api/locations";
import { initialListings } from "../data/mockData";
import { Filter, RotateCcw, Search } from "lucide-react";

/**
 * Flip to false once the backend integration is ready.
 * true  -> listings AND locations come only from local mock data (no network calls)
 * false -> mock data is shown first, then replaced by API data when it returns
 */
const USE_DUMMY_ONLY = true;

const LEVELS = ["Province", "District", "Sector", "Cell", "Village"];

// ---- Mock locations (UI visualization only) ----
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
  northern: [
    { id: "musanze", name: "Musanze" },
    { id: "burera", name: "Burera" },
    { id: "gicumbi", name: "Gicumbi" },
  ],
  southern: [
    { id: "huye", name: "Huye" },
    { id: "muhanga", name: "Muhanga" },
    { id: "nyanza", name: "Nyanza" },
  ],
  eastern: [
    { id: "rwamagana", name: "Rwamagana" },
    { id: "kayonza", name: "Kayonza" },
    { id: "bugesera", name: "Bugesera" },
  ],
  western: [
    { id: "rubavu", name: "Rubavu" },
    { id: "rusizi", name: "Rusizi" },
    { id: "karongi", name: "Karongi" },
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

const fetchProvinces = () =>
  USE_DUMMY_ONLY
    ? Promise.resolve({ data: MOCK_PROVINCES })
    : locationsApi.provinces();

const fetchChildren = (id) =>
  USE_DUMMY_ONLY
    ? Promise.resolve({ data: MOCK_CHILDREN[id] || [] })
    : locationsApi.children(id);

// ---- Filter option maps ----
const typeItems = {
  "": "All types",
  land: "Land",
  plot: "Plot",
  house: "House",
};

const triggerClass =
  "w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-brand-bg-soft";

const toItems = (list, placeholder) => {
  const map = { "": placeholder };
  (list || []).forEach((o) => {
    map[o.id] = o.name;
  });
  return map;
};

const FilterSelect = ({
  label,
  value,
  onChange,
  items,
  placeholder,
  disabled,
  children,
}) => (
  <div>
    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
      {label}
    </label>
    <Select
      value={value}
      onValueChange={(v) => onChange(v ?? "")}
      items={items}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClass} disabled={disabled}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        sideOffset={6}
        className="rounded-[9px] max-h-64"
      >
        {children}
      </SelectContent>
    </Select>
  </div>
);

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Location cascade: path[i] = selected id at level i, options[i] = choices at level i
  const [path, setPath] = useState([]);
  const [options, setOptions] = useState([[]]);

  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [maxPriceFilter, setMaxPriceFilter] = useState(
    searchParams.get("price") || ""
  );

  const locationId = useMemo(
    () =>
      [...path].reverse().find(Boolean) || searchParams.get("locationId") || "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path]
  );

  // Provinces (level 0)
  useEffect(() => {
    fetchProvinces()
      .then(({ data }) => setOptions([data || []]))
      .catch((err) => console.warn("Failed to load provinces:", err.message));
  }, []);

  const handleLevelChange = async (level, id) => {
    const nextPath = path.slice(0, level);
    nextPath[level] = id;
    setPath(nextPath);

    // drop every level below this one
    const nextOptions = options.slice(0, level + 1);
    setOptions(nextOptions);

    if (!id || level >= LEVELS.length - 1) return;

    try {
      const { data } = await fetchChildren(id);
      setOptions([...nextOptions, data || []]);
    } catch (err) {
      console.error(`Failed to load ${LEVELS[level + 1]}:`, err);
    }
  };

  // Dummy listings, filtered by type and max price (location isn't modelled in mock data)
  const dummyFiltered = (params) => {
    let data = initialListings.filter((listing) => !listing.vip);
    if (params.type) data = data.filter((l) => l.type === params.type);
    if (params.price)
      data = data.filter((l) => l.price <= Number(params.price));
    return data;
  };

  const load = async (params) => {
    setError("");
    setListings(dummyFiltered(params));

    if (USE_DUMMY_ONLY) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await listingsApi.listApproved({
        locationId: params.locationId || undefined,
        type: params.type || undefined,
        maxPriceRwf: params.price || undefined,
        pageSize: 50,
      });
      if (data && data.length > 0) setListings(data);
    } catch (err) {
      console.warn("Backend not ready – using dummy listings:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({
      locationId: searchParams.get("locationId") || "",
      type: searchParams.get("type") || "",
      price: searchParams.get("price") || "",
    });
  }, [searchParams]);

  const applyFilters = () => {
    const next = {};
    if (locationId) next.locationId = locationId;
    if (typeFilter) next.type = typeFilter;
    if (maxPriceFilter) next.price = maxPriceFilter;
    setSearchParams(next);
  };

  const handleReset = () => {
    setPath([]);
    setOptions((prev) => [prev[0] || []]);
    setTypeFilter("");
    setMaxPriceFilter("");
    setSearchParams({});
  };

  const handleApplyMobile = () => {
    applyFilters();
    setShowMobileFilter(false);
  };

  const handleResetMobile = () => {
    handleReset();
    setShowMobileFilter(false);
  };

  return (
    // 4rem = navbar height. Adjust if your navbar differs.
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 py-4 md:h-[calc(100vh-4rem)] md:overflow-hidden">
      <div className="flex flex-col md:flex-row gap-5 md:h-full">
        {/* Filter sidebar – scrolls independently */}
        <aside className="w-full md:w-72 md:shrink-0 bg-white border border-brand-line rounded-[9px] p-5 shadow-sm md:h-full md:overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-brand-ink flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-green" /> Filter
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-brand-green font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-4">
            {LEVELS.map((label, i) => {
              // show a level only once its parent is chosen (province always shown)
              if (i > 0 && !path[i - 1]) return null;
              const list = options[i] || [];
              if (i > 0 && list.length === 0) return null;
              return (
                <FilterSelect
                  key={label}
                  label={label}
                  value={path[i] || ""}
                  onChange={(id) => handleLevelChange(i, id)}
                  items={toItems(list, label)}
                  placeholder={label}
                >
                  <SelectItem value="">{label}</SelectItem>
                  {list.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </FilterSelect>
              );
            })}

            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              items={typeItems}
              placeholder="All types"
            >
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="land">Land</SelectItem>
              <SelectItem value="plot">Plot</SelectItem>
              <SelectItem value="house">House</SelectItem>
            </FilterSelect>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                Max price (RWF)
              </label>
              <input
                type="number"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                placeholder="e.g. 20000000"
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              />
            </div>

            <Button
              variant="default"
              onClick={applyFilters}
              className="w-full h-11 rounded-[9px] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Apply filters</span>
            </Button>
          </div>
        </aside>

        {/* Results – scrolls independently */}
        <main className="flex-1 min-w-0 md:h-full md:overflow-y-auto md:pr-1">
          <div className="flex items-center justify-between mb-5 pt-1 pb-2">
            <h2 className="text-xl font-bold text-brand-ink">
              Browse listings{" "}
              <span className="text-sm font-semibold text-brand-ink-soft">
                {loading ? "Loading…" : `— ${listings.length} results`}
              </span>
            </h2>
            <button
              onClick={() => setShowMobileFilter(true)}
              className="md:hidden flex items-center gap-2 text-sm font-semibold text-brand-ink border-2 border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-brand-green" /> Filter
            </button>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {!loading && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  className="rounded-[9px]!"
                />
              ))}
            </div>
          ) : !loading ? (
            <div className="bg-brand-bg-soft rounded-[9px] p-12 text-center border border-brand-line">
              <p className="text-brand-ink-soft text-base">
                No listings match these filters yet.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-lg text-brand-ink">Filter listings</h3>
              </div>
              <button onClick={() => setShowMobileFilter(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterContent
              cascadeKey={cascadeKey}
              typeFilter={typeFilter}
              maxPriceFilter={maxPriceFilter}
              onLocationChange={setLocationId}
              onTypeChange={setTypeFilter}
              onPriceChange={setMaxPriceFilter}
              onApply={handleApplyMobile}
              onReset={handleResetMobile}
              isMobile
            />
          </div>
        </div>
      )}
    </div>
  );
};