"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { track } from "@/lib/mixpanel";

/**
 * Shared favorites logic — tracks which listings the signed-in user has
 * saved and exposes a toggle function. Used by the feed, the listing detail
 * page, and the dedicated favourites page, so the behavior stays identical
 * everywhere instead of being reimplemented three times.
 */
export function useFavorites(initialIds: string[] = []) {
  const { user } = useUser();
  const { session } = useSession();
  const supabase = createClient(session);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(
    () => new Set(initialIds),
  );

  useEffect(() => {
    if (!user) {
      setFavoritedIds(new Set());
      return;
    }
    let cancelled = false;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (!profile || cancelled) return;

      const { data: favorites } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("profile_id", profile.id);
      if (!cancelled && favorites) {
        setFavoritedIds(new Set(favorites.map((f) => f.listing_id)));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!user) {
        toast.error("Please sign in first");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (!profile) return;

      const wasFavorited = favoritedIds.has(listingId);

      // Optimistic update — flips instantly, then syncs to the DB.
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      if (wasFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("profile_id", profile.id)
          .eq("listing_id", listingId);
        if (error) {
          toast.error("Failed to remove favourite");
          setFavoritedIds((prev) => new Set(prev).add(listingId));
        }
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ profile_id: profile.id, listing_id: listingId });
        if (error) {
          toast.error("Failed to save favourite");
          setFavoritedIds((prev) => {
            const next = new Set(prev);
            next.delete(listingId);
            return next;
          });
        } else {
          track("Listing Favorited", { listing_id: listingId });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, favoritedIds],
  );

  return { favoritedIds, toggleFavorite };
}
