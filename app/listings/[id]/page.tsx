import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { ListingDetailClient } from "@/components/ListingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: listing } = await supabase
    .from("listings")
    .select("*, seller:profiles(*)")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("seller_id", listing.seller_id);

  return <ListingDetailClient listing={listing} reviews={reviews ?? []} />;
}
