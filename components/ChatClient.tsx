"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/utils";
import Link from "next/link";
import type { Message } from "@/types";
import { track } from "@/lib/mixpanel";

interface ConversationData {
  id: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    price: number;
    status: string;
  };
  buyer: {
    id: string;
    display_name: string;
    is_anonymous: boolean;
    pseudonym_id: string;
    avatar_url: string | null;
  };
  seller: {
    id: string;
    display_name: string;
    is_anonymous: boolean;
    pseudonym_id: string;
    avatar_url: string | null;
  };
}

interface Props {
  conversation: ConversationData;
  userId: string;
}

export function ChatClient({ conversation, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { session } = useSession();
  const supabase = createClient(session);

  const isBuyer = conversation.buyer.id === userId;
  const other = isBuyer ? conversation.seller : conversation.buyer;
  const otherName = other.is_anonymous
    ? other.pseudonym_id
    : other.display_name;

  useEffect(() => {
    const markIncomingAsRead = async () => {
      // Marks any messages the other person sent as read now that this
      // conversation is open — this is what makes the unread badge clear.
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversation.id)
        .eq("read", false)
        .neq("sender_id", userId);
    };

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      markIncomingAsRead();
    };
    load();

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // A new message arrived while this chat is open on screen — count
          // it as read immediately instead of waiting for the next visit.
          if (newMsg.sender_id !== userId) {
            markIncomingAsRead();
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversation.id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: userId,
      content: input.trim(),
    });

    if (!error) {
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);

      track("Message Sent", {
        conversation_id: conversation.id,
        listing_id: conversation.listing.id,
      });

      setInput("");
    }
    setSending(false);
  }

  const listing = conversation.listing;

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 6rem)" }}>
      <div className="flex items-center gap-3 rounded-t-xl border border-stone-200 bg-white p-3.5">
        <Link
          href={`/listings/${listing.id}`}
          className="flex items-center gap-3 min-w-0 flex-1"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {listing.images?.[0] ? (
              <img
                src={listing.images[0]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-stone-300">
                ?
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-800">
              {listing.title}
            </p>
            <p className="text-xs text-stone-500">
              {formatPrice(listing.price)}
              {listing.status === "sold" && (
                <span className="ml-2 text-red-500">Sold</span>
              )}
            </p>
          </div>
        </Link>
        <span className="text-xs text-stone-400">with {otherName}</span>
      </div>

      <div className="flex-1 overflow-y-auto border-x border-stone-200 bg-stone-50 p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-stone-400">
              Start a conversation about this listing
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  isMine
                    ? "bg-brand-600 text-white"
                    : "bg-white text-stone-700 shadow-sm"
                }`}
              >
                <p>{msg.content}</p>
                <p
                  className={`mt-0.5 text-right text-[10px] ${
                    isMine ? "text-brand-200" : "text-stone-400"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 rounded-b-xl border border-stone-200 bg-white p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-stone-300 px-3.5 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
