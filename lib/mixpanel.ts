"use client";

/**
 * Thin wrapper around the Mixpanel JS SDK (loaded from the CDN by
 * <MixpanelProvider>, see components/MixpanelProvider.tsx). Every function
 * here is a safe no-op if Mixpanel hasn't loaded yet or no project token is
 * configured, so it's always safe to call these from anywhere in the app —
 * event volume is opt-in via NEXT_PUBLIC_MIXPANEL_TOKEN.
 */

declare global {
  interface Window {
    mixpanel?: {
      init: (token: string, config?: Record<string, unknown>) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      identify: (id: string) => void;
      reset: () => void;
      people: {
        set: (properties: Record<string, unknown>) => void;
      };
    };
  }
}

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export function isMixpanelReady(): boolean {
  return Boolean(MIXPANEL_TOKEN) && typeof window !== "undefined" && !!window.mixpanel;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!isMixpanelReady()) return;
  try {
    window.mixpanel!.track(event, properties);
  } catch (err) {
    console.error("Mixpanel track error:", err);
  }
}

export function identifyUser(userId: string) {
  if (!isMixpanelReady()) return;
  try {
    window.mixpanel!.identify(userId);
  } catch (err) {
    console.error("Mixpanel identify error:", err);
  }
}

export function setUserProperties(properties: Record<string, unknown>) {
  if (!isMixpanelReady()) return;
  try {
    window.mixpanel!.people.set(properties);
  } catch (err) {
    console.error("Mixpanel people.set error:", err);
  }
}

export function resetMixpanelUser() {
  if (!isMixpanelReady()) return;
  try {
    window.mixpanel!.reset();
  } catch (err) {
    console.error("Mixpanel reset error:", err);
  }
}
