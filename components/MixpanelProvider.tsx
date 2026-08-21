"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  identifyUser,
  resetMixpanelUser,
  setUserProperties,
  track,
} from "@/lib/mixpanel";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

/**
 * Mounted once at the app root (see app/layout.tsx). Loads the Mixpanel
 * library from the CDN, tracks page views on every route change, and keeps
 * the Mixpanel identity in sync with the signed-in Clerk user.
 *
 * If NEXT_PUBLIC_MIXPANEL_TOKEN isn't set, this renders nothing and every
 * tracking call elsewhere in the app stays a silent no-op — so it's safe to
 * deploy before a token is configured.
 */
export function MixpanelProvider() {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    track("Page Viewed", { path: pathname });
  }, [ready, pathname]);

  useEffect(() => {
    if (!ready || !isLoaded) return;

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
  }, [ready, isLoaded, user]);

  if (!MIXPANEL_TOKEN) return null;

  return (
    <Script
      src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.mixpanel) {
          window.mixpanel.init(MIXPANEL_TOKEN, {
            persistence: "localStorage",
            track_pageview: false,
          });
          setReady(true);
        }
      }}
      onError={() => {
        console.error("Mixpanel script failed to load");
      }}
    />
  );
}
