"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/utils";
import type { Listing, Review, Category, Condition } from "@/types";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  CATEGORY_ICONS,
} from "@/types";
import toast from "react-hot-toast";
import { track } from "@/lib/mixpanel";

interface Props {
  listing: Listing;
  reviews: Review[];
}

export function ListingDetailClient({ listing, reviews }: Props) {
  const { user } = useUser();
  const { session } = useSession();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [contactInfo, setContactInfo] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const router = useRouter();
  const supabase = createClient(session);

  useEffect(() => {
    if (!user) {
      setProfileId(null);
      return;
    }

    const loadProfileId = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      setProfileId(profile?.id ?? null);
    };

    loadProfileId();
  }, [user]);

  useEffect(() => {
    track("Listing Viewed", {
      listing_id: listing.id,
      category: listing.category,
      price: listing.price,
      is_sample: listing.is_sample,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id]);

  const isOwner = profileId === listing.seller_id;
  const sellerName = listing.is_anonymous
    ? listing.seller?.pseudonym_id ?? "Anonymous"
    : listing.seller?.display_name ?? "Unknown";

  async function handleMessage() {
    
    if (!user) {toast.error("Please sign in first");
  return;
}

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
      console.log("Profile:", profile);
console.log("User ID:", user.id);
    if (!profile) return;

    if (profile.id === listing.seller_id) {
      toast.error("You can't message yourself");
      return;
    }

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", profile.id)
      .single();

    let convId: string;

    if (existing) {
      convId = existing.id;
    } else {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          buyer_id: profile.id,
          seller_id: listing.seller_id,
        })
        .select("id")
        .single();
      if (error) {
        toast.error("Failed to start conversation");
        return;
      }
      convId = conv!.id;
      track("Conversation Started", {
        listing_id: listing.id,
        category: listing.category,
      });
    }
console.log("Conversation ID:", convId);
    router.push(`/messages/${convId}`);
  }

  function getContactDisplay() {
    if (!contactInfo) return null;
    const parts = contactInfo.split("\n");
    return parts.map((p, i) => <p key={i}>{p}</p>);
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="aspect-[16/10] overflow-hidden bg-stone-100">
          {listing.images.length > 0 ? (
            <img
              src={listing.images[selectedImage]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-stone-300">
              {CATEGORY_ICONS[listing.category as Category]}
            </div>
          )}
        </div>

        {listing.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-stone-100 px-4 py-3">
            {listing.images.map((url, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === selectedImage
                    ? "border-brand-500"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {listing.is_sample && (
                <span className="mb-1.5 inline-block rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  Sample
                </span>
              )}
              <h1 className="text-xl font-semibold text-stone-900">
                {listing.title}
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                {CATEGORY_LABELS[listing.category as Category]}
                {listing.condition && ` · ${CONDITION_LABELS[listing.condition]}`}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xl font-bold text-brand-700">
                {formatPrice(listing.price)}
              </span>
              {listing.negotiable && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                  Negotiable
                </span>
              )}
            </div>
          </div>

          {listing.is_sample && (
            <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
              This is a sample listing to show what GIM Bazaar looks like in
              action.
            </p>
          )}

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {listing.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-500">
            <div>
              <span className="font-medium text-stone-700">Seller:</span>{" "}
              {sellerName}
            </div>
            <div>
              <span className="font-medium text-stone-700">Posted:</span>{" "}
              {timeAgo(listing.created_at)}
            </div>
            {listing.payment_method && (
              <div>
                <span className="font-medium text-stone-700">Payment:</span>{" "}
                {listing.payment_method}
              </div>
            )}
          </div>

          {!listing.is_anonymous && avgRating && (
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="mt-3 flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
            >
              <span className="text-amber-500">{`\u2605`.repeat(Math.round(parseFloat(avgRating)))}</span>
              <span>
                {avgRating} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </button>
          )}

          {showReviews && !listing.is_anonymous && reviews.length > 0 && (
            <div className="mt-4 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
              {reviews.map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="text-amber-500">
                    {`\u2605`.repeat(r.rating)}
                    {`\u2606`.repeat(5 - r.rating)}
                  </div>
                  <p className="mt-0.5 text-stone-600">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {!isOwner && (
              <button
                onClick={handleMessage}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Message Seller
              </button>
            )}
            {isOwner && (
              <>
                <Link
                  href={`/listings/edit/${listing.id}`}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Edit
                </Link>
                <button
                  onClick={async () => {
                    if (
                      !confirm("Mark this listing as sold? It will be hidden from the feed.")
                    )
                      return;
                    await supabase
                      .from("listings")
                      .update({ status: "sold" })
                      .eq("id", listing.id);
                    track("Listing Marked as Sold", {
                      listing_id: listing.id,
                      category: listing.category,
                    });
                    toast.success("Marked as sold");
                    router.refresh();
                  }}
                  className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Mark as Sold
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
