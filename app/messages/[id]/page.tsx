import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { ChatClient } from "@/components/ChatClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  // conversations.buyer_id / seller_id store the internal Supabase profile
  // UUID, not the Clerk user ID — resolve it first so the participant check
  // below actually matches.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();
  if (!profile) redirect("/sign-in");

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`*,listing:listings(*),buyer:profiles!buyer_id(*),seller:profiles!seller_id(*)`)
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const isParticipant =
    conversation.buyer_id === profile.id || conversation.seller_id === profile.id;
  if (!isParticipant) notFound();

  return <ChatClient conversation={conversation} userId={profile.id} />;
}
