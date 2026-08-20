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
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-stone-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-sm text-white">
            🛍️
          </span>
          <span>
            GIM <span className="text-brand-600">Bazaar</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!isLoaded ? null : user ? (
            <>
              <Link
                href="/listings/new"
                className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md sm:inline-flex"
              >
                + Sell
              </Link>
              <Link
                href="/messages"
                className={`text-sm font-medium transition ${
                  pathname === "/messages"
                    ? "text-brand-600"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Messages
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
                        Sell an Item
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
