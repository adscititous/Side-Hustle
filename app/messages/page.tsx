import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createServerSupabase();
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  // conversations.buyer_id / seller_id store the internal Supabase profile
  // UUID, not the Clerk user ID — resolve it first before querying.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  const userId = profile?.id ?? null;

  const { data: conversations } = userId
    ? await supabase
        .from("conversations")
        .select(
          "*, listing:listings(id, title, images), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)",
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })
    : { data: null };

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const unreadByConversation = new Map<string, number>();

  if (userId && conversationIds.length > 0) {
    const { data: unreadRows } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .eq("read", false)
      .neq("sender_id", userId);

    for (const row of unreadRows ?? []) {
      unreadByConversation.set(
        row.conversation_id,
        (unreadByConversation.get(row.conversation_id) ?? 0) + 1,
      );
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Messages</h1>

      {!conversations || conversations.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium text-stone-400">No conversations yet</p>
          <p className="mt-1 text-sm text-stone-400">
            Message a seller to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isBuyer = conv.buyer_id === userId;
            const other = isBuyer ? conv.seller : conv.buyer;

            const otherName = other?.is_anonymous
              ? other?.pseudonym_id ?? "Anonymous"
              : other?.display_name ?? "Unknown";

            const thumb = conv.listing?.images?.[0];
            const unread = unreadByConversation.get(conv.id) ?? 0;

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 transition hover:shadow-sm"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg text-stone-300">
                      ?
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      unread > 0
                        ? "font-semibold text-stone-900"
                        : "font-medium text-stone-800"
                    }`}
                  >
                    {conv.listing?.title ?? "Unknown listing"}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    with {otherName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-stone-400">
                    {formatDistanceToNow(new Date(conv.last_message_at ?? conv.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
