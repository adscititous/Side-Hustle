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
    .select("*, listing:listings(*), buyer:profiles(*), seller:profiles(*)")
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const isParticipant =
    conversation.buyer_id === userData.user.id ||
    conversation.seller_id === userData.user.id;
  if (!isParticipant) notFound();

  return <ChatClient conversation={conversation} userId={userData.user.id} />;
}
