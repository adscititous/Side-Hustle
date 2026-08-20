"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk, useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export function Navbar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient(session);

  async function handleSignOut() {
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
                href="/messages"
                aria-label="Messages"
                title="Messages"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
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
