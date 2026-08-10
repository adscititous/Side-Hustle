import { createServerSupabase } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { ChatClient } from "@/components/ChatClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`*,listing:listings(*),buyer:profiles!buyer_id(*),seller:profiles!seller_id(*)`)
    .eq("id", id)
    .single();

console.log("Route ID:", id);
console.log("Conversation:", conversation);

  if (!conversation) notFound();

  console.log("Logged in user:", userData.user.id);
console.log("Buyer:", conversation.buyer_id);
console.log("Seller:", conversation.seller_id);

  const isParticipant =
    conversation.buyer_id === userData.user.id ||
    conversation.seller_id === userData.user.id;
  if (!isParticipant) notFound();

  return <ChatClient conversation={conversation} userId={userData.user.id} />;
}
