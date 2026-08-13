import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) redirect("/auth");

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <ProfileClient profile={profile} listings={listings ?? []} />
  );
}
