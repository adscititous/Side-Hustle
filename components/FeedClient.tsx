"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Listing, Category } from "@/types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/types";
import { ListingCard } from "@/components/ListingCard";

interface Props {
  initialListings: Listing[];
}

const ALL = "all";

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Browse</h1>
        <p className="mt-1 text-sm text-stone-500">
          Find what you need from fellow GIM students
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
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
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <Link
          href="/listings/new"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 sm:w-auto"
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
            onClick={() => setActiveCategory(c.value)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeCategory === c.value
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {c.value !== ALL && CATEGORY_ICONS[c.value as Category]}{" "}
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium text-stone-400">No listings yet</p>
          <p className="mt-1 text-sm text-stone-400">
            Be the first to post something!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
