"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  identifyUser,
  resetMixpanelUser,
  setUserProperties,
  track,
} from "@/lib/mixpanel";

/**
 * Mounted once at the app root (see app/layout.tsx). Tracks page views on
 * every route change and keeps the analytics identity in sync with the
 * signed-in Clerk user. Tracking is routed server-side through
 * /api/events — see lib/mixpanel.ts for why (ad-blockers widely block
 * Mixpanel's own domains, so we don't talk to them from the browser).
 */
export function MixpanelProvider() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    track("Page Viewed", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      if (identifiedUserId.current !== user.id) {
        identifiedUserId.current = user.id;
        identifyUser(user.id);
        setUserProperties({
          $email: user.primaryEmailAddress?.emailAddress,
          $name: user.fullName ?? user.username ?? undefined,
          username: user.username,
          $created: user.createdAt ?? undefined,
        });
      }
    } else if (identifiedUserId.current) {
      identifiedUserId.current = null;
      resetMixpanelUser();
    }
  }, [isLoaded, user]);

  return null;
}
