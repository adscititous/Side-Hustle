"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import type { Profile, Listing } from "@/types";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/types";
import { formatPrice, timeAgo } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";
import { track } from "@/lib/mixpanel";

interface Props {
  profile: Profile;
  listings: Listing[];
}

export function ProfileClient({ profile, listings }: Props) {
  const [isAnonymous, setIsAnonymous] = useState(profile.is_anonymous);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { session } = useSession();
  const supabase = createClient(session);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        is_anonymous: isAnonymous,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
    } else {
      track("Profile Updated", { is_anonymous: isAnonymous });
      toast.success("Profile updated");
      router.refresh();
    }
    setSaving(false);
  }

  const activeListings = listings.filter((l) => l.status === "active");
  const soldListings = listings.filter((l) => l.status === "sold");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Profile</h1>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {profile.pseudonym_id.slice(-2)}
          </div>
          <div>
            <p className="text-lg font-medium text-stone-800">
              {profile.display_name}
            </p>
            <p className="text-sm text-stone-500">
              {profile.pseudonym_id}
              {profile.is_anonymous
                ? " - Anonymous profile"
                : " - Public profile"}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-700">
                Public Profile
              </p>
              <p className="text-xs text-stone-500">
                When off, your real name is hidden and replaced with your
                pseudonym. Reviews are only visible with a public profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative h-6 w-11 rounded-full transition ${
                !isAnonymous ? "bg-brand-600" : "bg-stone-300"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  !isAnonymous ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight">
        My Listings
      </h2>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-sm text-stone-400">
            You haven&apos;t listed anything yet
          </p>
          <Link
            href="/listings/new"
            className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Post your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 transition hover:shadow-sm"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {l.images?.[0] ? (
                  <img
                    src={l.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-stone-300">
                    ?
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">
                  {l.title}
                </p>
                <p className="text-xs text-stone-500">
                  {CATEGORY_LABELS[l.category as keyof typeof CATEGORY_LABELS]}
                  {l.condition && ` · ${CONDITION_LABELS[l.condition]}`}
                  {" · "}
                  {timeAgo(l.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-700">
                  {formatPrice(l.price)}
                </p>
                <p
                  className={`text-xs ${
                    l.status === "active" ? "text-green-600" : "text-stone-400"
                  }`}
                >
                  {l.status === "active" ? "Active" : "Sold"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
