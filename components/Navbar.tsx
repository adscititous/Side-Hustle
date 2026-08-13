"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export function Navbar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    router.refresh();
    router.push("/");
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand-700"
        >
          GIM Bazaar
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/listings/new"
                className="hidden rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 sm:inline-block"
              >
                Sell
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
                >
                  {user.primaryEmailAddress?.emailAddress?.[0].toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                      <div className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
                        {user.primaryEmailAddress?.emailAddress}
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/listings/new"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 sm:hidden"
                      >
                        Sell an Item
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
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
              className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
