"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Listing, Category } from "@/types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/types";
import { ListingCard } from "@/components/ListingCard";
import { track } from "@/lib/mixpanel";

interface Props {
  initialListings: Listing[];
}

const ALL = "all";
const HERO_IMAGE = "/hero-campus.jpg";

export function FeedClient({ initialListings }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const categories: { value: string; label: string }[] = [
    { value: ALL, label: "All" },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const filtered = useMemo(() => {
    return initialListings.filter((l) => {
      const matchCategory =
        activeCategory === ALL || l.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [initialListings, activeCategory, search]);

  useEffect(() => {
    if (!search.trim()) return;
    const timeout = setTimeout(() => {
      track("Search Performed", {
        query: search,
        result_count: filtered.length,
      });
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleCategoryChange(value: string) {
    setActiveCategory(value);
    track("Category Filtered", { category: value });
  }

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-800/85 to-brand-700/40" />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="max-w-lg font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Buy, Sell, Repeat — All Within GIM
          </h1>
          <p className="mt-2 max-w-md text-sm text-brand-100 sm:text-base">
            Textbooks, cycles, hostel stuff, and more — find it or flip it
            without ever leaving campus.
          </p>
          <a
            href="#listings"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            Browse Listings
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </a>
        </div>
      </div>

      <div id="listings" className="scroll-mt-24">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Link
            href="/listings/new"
            className="flex items-center justify-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md sm:w-auto"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Sell
          </Link>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategoryChange(c.value)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === c.value
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              {c.value === ALL ? "🏬" : CATEGORY_ICONS[c.value as Category]}{" "}
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl">
              🔍
            </div>
            <p className="mt-4 text-lg font-medium text-stone-500">
              No listings yet
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Be the first to post something!
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
