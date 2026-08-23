"use client";

import { useState } from "react";
import type { Listing } from "@/types";
import { ListingCard } from "@/components/ListingCard";
import { useFavorites } from "@/lib/useFavorites";

interface Props {
  initialListings: Listing[];
}

export function FavoritesClient({ initialListings }: Props) {
  // Removing a favourite here should drop it out of the list immediately —
  // this page only ever shows listings you've saved, so track the list
  // locally and prune it as items get unfavorited.
  const [listings, setListings] = useState(initialListings);
  const { favoritedIds, toggleFavorite } = useFavorites(
    initialListings.map((l) => l.id),
  );

  function handleToggleFavorite(listingId: string) {
    toggleFavorite(listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Favourites</h1>

      {listings.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl">
            🤍
          </div>
          <p className="mt-4 text-lg font-medium text-stone-500">
            No favourites yet
          </p>
          <p className="mt-1 text-sm text-stone-400">
            Tap the heart on a listing to save it for later
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={favoritedIds.has(listing.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
