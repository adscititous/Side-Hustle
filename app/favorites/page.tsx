import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { FavoritesClient } from "@/components/FavoritesClient";
import type { Listing } from "@/types";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = await createServerSupabase();
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  const { data: favorites } = profile
    ? await supabase
        .from("favorites")
        .select("listing_id, created_at, listing:listings(*, seller:profiles(*))")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const listings = (favorites ?? [])
    .map((f) => f.listing as unknown as Listing | null)
    .filter((l): l is Listing => Boolean(l));

  return <FavoritesClient initialListings={listings} />;
}
