"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * Makes sure every signed-in Clerk user has a matching `profiles` row in
 * Supabase, even if they signed up through a path that doesn't already call
 * /api/profile/ensure (e.g. Google OAuth). Safe to mount once at the app
 * root — it's a no-op upsert if the profile already exists.
 */
export function ProfileEnsurer() {
  const { user, isLoaded } = useUser();
  const ensured = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || ensured.current) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    ensured.current = true;

    fetch("/api/profile/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkUserId: user.id, email }),
    }).catch((error) => {
      console.error("PROFILE ENSURE ERROR:", error);
    });
  }, [isLoaded, user]);

  return null;
}
