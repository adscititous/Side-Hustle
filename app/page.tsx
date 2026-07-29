import { createServerSupabase } from "@/lib/supabase-server";
import { FeedClient } from "@/components/FeedClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const { data: listings } = await supabase
    .from("listings")
    .select("*, seller:profiles(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return <FeedClient initialListings={listings ?? []} />;
}
