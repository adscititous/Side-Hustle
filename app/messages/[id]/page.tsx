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
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`*,listing:listings(*),buyer:profiles!buyer_id(*),seller:profiles!seller_id(*)`)
    .eq("id", id)
    .single();

console.log("Route ID:", id);
console.log("Conversation:", conversation);

  if (!conversation) notFound();

  console.log("Logged in user:", userId);
console.log("Buyer:", conversation.buyer_id);
console.log("Seller:", conversation.seller_id);

  const isParticipant =
    conversation.buyer_id === userId ||
    conversation.seller_id === userId;
  if (!isParticipant) notFound();

  return <ChatClient conversation={conversation} userId={userId} />;
}
