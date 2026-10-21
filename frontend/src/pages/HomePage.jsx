import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ListingCard } from "../components/ListingCard";
import { listingsApi } from "../api/listings";
import { locationsApi } from "../api/locations";
import { initialListings } from "../data/mockData";
import { Search } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const typeItems = {
  "": "Any type",
  land: "Land",
  plot: "Plot",
  house: "House",
};

const priceItems = {
  "": "Any price",
  5000000: "< 5M RWF",
  20000000: "5M – 20M RWF",
  100000000: "> 20M RWF",
};

export const HomePage = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [locationId, setLocationId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [error, setError] = useState("");

  // Dynamically retrieve provinces from locationsApi
  useEffect(() => {
    locationsApi
      .provinces()
      .then(({ data }) => setProvinces(data || []))
      .catch((err) => setError(err.message));
  }, []);

  // Dynamically retrieve districts when province changes
  const handleProvinceChange = async (provId) => {
    setSelectedProvince(provId);
    setSelectedDistrict("");
    setLocationId(provId);

    if (!provId) {
      setDistricts([]);
      return;
    }

    try {
      const { data } = await locationsApi.children(provId);
      setDistricts(data || []);
    } catch (err) {
      console.error("Failed to load districts:", err);
    }
  };

  const handleDistrictChange = (distId) => {
    setSelectedDistrict(distId);
    setLocationId(distId || selectedProvince);
  };

  // Build items maps for Base UI Select display
  const provinceItems = useMemo(() => {
    const map = { "": "Province" };
    provinces.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [provinces]);

  const districtItems = useMemo(() => {
    const map = { "": selectedProvince ? "District" : "District" };
    districts.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [districts, selectedProvince]);

  useEffect(() => {
    const dummy = initialListings.filter((listing) => !listing.vip).slice(0, 4);
    setListings(dummy);

    listingsApi
      .listApproved({ pageSize: 4 })
      .then(({ data }) => {
        const real = (data || []).filter((listing) => listing.vip === false);
        if (real.length > 0) setListings(real.slice(0, 4));
      })
      .catch((err) => {
        console.warn("Backend not ready – using dummy listings:", err.message);
      });
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationId) params.set("locationId", locationId);
    if (selectedProvince) params.set("province", selectedProvince);
    if (selectedDistrict) params.set("district", selectedDistrict);
    if (selectedType) params.set("type", selectedType);
    if (selectedPrice) params.set("price", selectedPrice);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#00594A] to-[#007A66] text-white py-16 px-4 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
            {t("hero_title")}
          </h1>
          <p className="mt-4 text-base sm:text-lg opacity-90 max-w-xl leading-relaxed">
            {t("hero_sub")}
          </p>

          {/* Refactored One-Liner Search Card: Province | District | Any type | Any price | Search */}
          <div className="search-card bg-white text-brand-ink rounded-[14px] p-3 sm:p-4 mt-8 shadow-2xl border border-brand-line/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
              {/* 1. Province Select (Dynamic from locationsApi) */}
              <div className="w-full">
                <Select
                  value={selectedProvince}
                  onValueChange={handleProvinceChange}
                  items={provinceItems}
                >
                  <SelectTrigger
                    id="s-prov"
                    className="w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3"
                  >
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="start"
                    sideOffset={6}
                    className="rounded-[9px]"
                  >
                    <SelectItem value="">Province</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. District Select (Cascading from locationsApi) */}
              <div className="w-full">
                <Select
                  value={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  items={districtItems}
                  disabled={!selectedProvince || districts.length === 0}
                >
                  <SelectTrigger
                    id="s-dist"
                    disabled={!selectedProvince || districts.length === 0}
                    className="w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-brand-bg-soft"
                  >
                    <SelectValue
                      placeholder={
                        selectedProvince ? "District" : "Select Province first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="start"
                    sideOffset={6}
                    className="rounded-[9px] max-h-64"
                  >
                    <SelectItem value="">District</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Property Type Select (Land | Plot | House) */}
              <div className="w-full">
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                  items={typeItems}
                >
                  <SelectTrigger className="w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="start"
                    sideOffset={6}
                    className="rounded-[9px]"
                  >
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="plot">Plot</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Price Select (< 5M | 5M–20M | > 20M) */}
              <div className="w-full">
                <Select
                  value={selectedPrice}
                  onValueChange={setSelectedPrice}
                  items={priceItems}
                >
                  <SelectTrigger className="w-full h-11 rounded-[9px] text-sm font-medium border-brand-line bg-white hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 px-3">
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="start"
                    sideOffset={6}
                    className="rounded-[9px]"
                  >
                    <SelectItem value="">Any price</SelectItem>
                    <SelectItem value="5000000">&lt; 5M RWF</SelectItem>
                    <SelectItem value="20000000">5M – 20M RWF</SelectItem>
                    <SelectItem value="100000000">&gt; 20M RWF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Search Button */}
              <div className="w-full">
                <Button
                  variant="default"
                  onClick={handleSearch}
                  className="w-full h-11 rounded-[9px] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{t("search")}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-8 sm:gap-14 mt-10 text-white">
            <div>
              <b className="text-3xl font-bold block">{listings.length || 4}</b>
              <span className="text-xs sm:text-sm opacity-85">{t("st1")}</span>
            </div>
            <div>
              <b className="text-3xl font-bold block">30</b>
              <span className="text-xs sm:text-sm opacity-85">
                Districts of Rwanda
              </span>
            </div>
            <div>
              <b className="text-3xl font-bold block">100%</b>
              <span className="text-xs sm:text-sm opacity-85">
                Verified Title Deeds
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-14 px-4 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">
              {t("feat")}
            </h2>
            <button
              onClick={() => navigate("/browse")}
              className="text-sm font-semibold text-brand-green hover:underline cursor-pointer"
            >
              View all →
            </button>
          </div>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-8">
            Fresh opportunities approved by our team
          </p>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[22px]">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-brand-bg-soft rounded-card p-10 text-center border border-brand-line text-brand-ink-soft">
              No approved listings yet. Approved blocker posts will appear here.
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-brand-bg-soft py-14 px-4 sm:px-8 lg:px-10 border-y border-brand-line">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-1">
            {t("how")}
          </h2>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-8">
            From search to handshake in four steps
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-card p-6 border border-brand-line shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4 shadow-xs">
                    {n}
                  </div>
                  <h4 className="font-bold text-base text-brand-ink mb-2">
                    {t(`h${n}t`)}
                  </h4>
                  <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">
                    {t(`h${n}p`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
