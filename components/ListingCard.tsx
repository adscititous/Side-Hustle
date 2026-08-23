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
  const sellerName = listing.is_anonymous
    ? listing.seller?.pseudonym_id ?? "Anonymous"
    : listing.seller?.display_name ?? "Unknown";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {listing.is_sample && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-stone-900/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Sample
          </span>
        )}
        {thumb ? (
          <img
            src={thumb}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-stone-300">
            {CATEGORY_ICONS[listing.category as Category]}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
          <span className="text-base font-bold text-white drop-shadow-sm">
            {formatPrice(listing.price)}
          </span>
          {listing.negotiable && (
            <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-700 backdrop-blur-sm">
              Negotiable
            </span>
          )}
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-semibold leading-snug text-stone-800 line-clamp-2">
          {listing.title}
        </h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
            {CATEGORY_LABELS[listing.category as Category]}
          </span>
          {listing.condition && (
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
              {CONDITION_LABELS[listing.condition]}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
              {sellerName[0]?.toUpperCase()}
            </span>
            <span className="text-stone-500">{sellerName}</span>
          </div>
          <span>{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
