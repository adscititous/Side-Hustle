import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createServerSupabase();
  const { userId } = await auth();
if (!userId) redirect("/sign-in");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, listing:listings(id, title, images), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });


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
                  <p className="truncate text-sm font-medium text-stone-800">
                    {conv.listing?.title ?? "Unknown listing"}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    with {otherName}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-stone-400">
                  {formatDistanceToNow(new Date(conv.last_message_at ?? conv.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
