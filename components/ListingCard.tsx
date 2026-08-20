"use client";

import Link from "next/link";
import type { Listing, Category } from "@/types";
import { CATEGORY_LABELS, CONDITION_LABELS, CATEGORY_ICONS } from "@/types";
import { formatPrice, timeAgo } from "@/lib/utils";

interface Props {
  listing: Listing;
}

export function ListingCard({ listing }: Props) {
  const thumb = listing.images?.[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {listing.is_sample && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            Sample
          </span>
        )}
        {thumb ? (
          <img
            src={thumb}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-stone-300">
            {CATEGORY_ICONS[listing.category as Category]}
          </div>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug text-stone-800 line-clamp-2">
            {listing.title}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-brand-700">
            {formatPrice(listing.price)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
          <span className="rounded-md bg-stone-100 px-2 py-0.5 font-medium">
            {CATEGORY_LABELS[listing.category as Category]}
          </span>
          {listing.condition && (
            <span className="rounded-md bg-stone-100 px-2 py-0.5">
              {CONDITION_LABELS[listing.condition]}
            </span>
          )}
          <span className="ml-auto">{timeAgo(listing.created_at)}</span>
        </div>
        <div className="mt-2 text-xs text-stone-400">
          {listing.is_anonymous
            ? listing.seller?.pseudonym_id ?? "Anonymous"
            : listing.seller?.display_name ?? "Unknown"}
        </div>
      </div>
    </Link>
  );
}
