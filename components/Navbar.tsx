"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk, useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { track } from "@/lib/mixpanel";

export function Navbar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient(session);

  useEffect(() => {
    if (!user) {
      setProfileId(null);
      return;
    }
    let cancelled = false;

    supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfileId(data?.id ?? null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!profileId) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("read", false)
        .neq("sender_id", profileId);
      setUnreadCount(count ?? 0);
    };
    fetchUnreadCount();

    // RLS already limits this to messages in conversations profileId is
    // part of, so no per-conversation filter is needed here.
    const channel = supabase
      .channel(`unread-messages:${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        fetchUnreadCount,
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function handleSignOut() {
    track("Signed Out");
    await signOut();
    setMenuOpen(false);
    router.refresh();
    router.push("/");
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/70 bg-white/85 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm ring-2 ring-brand-100">
            <span className="font-display text-[11px] font-bold tracking-widest">
              GIM
            </span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold tracking-tight text-stone-900">
              GIM <span className="text-brand-600">Bazaar</span>
            </span>
            <span className="mt-1 hidden text-[11px] font-medium tracking-wide text-stone-500 sm:block">
              Student Marketplace
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isLoaded ? null : user ? (
            <>
              <Link
                href="/favorites"
                aria-label="Favourites"
                title="Favourites"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  pathname === "/favorites"
                    ? "bg-brand-100 text-brand-700"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-6.716-4.35-9.428-8.06C.688 10.24 1.03 6.5 4.03 4.86c2.36-1.29 5.06-.5 6.97 1.6 1.91-2.1 4.61-2.89 6.97-1.6 3 1.64 3.342 5.38 1.458 8.08C18.716 16.65 12 21 12 21z"
                  />
                </svg>
              </Link>

              <Link
                href="/messages"
                aria-label="Messages"
                title="Messages"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                  pathname === "/messages"
                    ? "bg-brand-100 text-brand-700"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 ring-2 ring-transparent transition hover:ring-brand-200"
                >
                  {user.primaryEmailAddress?.emailAddress?.[0].toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2.5 w-52 overflow-hidden rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-stone-100">
                      <div className="border-b border-stone-100 px-4 py-2.5 text-xs text-stone-500">
                        {user.primaryEmailAddress?.emailAddress}
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/listings/new"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 sm:hidden"
                      >
                        Post a Listing
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/listings/new"
                className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md sm:inline-flex"
              >
                + Post a Listing
              </Link>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
