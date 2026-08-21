"use client";

/**
 * Analytics tracking, routed through our own /api/events endpoint instead
 * of loading Mixpanel's script in the browser (see components/
 * MixpanelProvider.tsx for where it used to be loaded). Ad-blockers and
 * DNS-level tracker blockers — very common on students' phones — block
 * cdn.mxpnl.com / api.mixpanel.com by name, which silently dropped every
 * single event under that setup (confirmed: zero events ever received).
 * Sending events to our own domain instead means nothing on the visitor's
 * device ever contacts a recognizable third-party tracker.
 *
 * Every function here is a safe no-op on failure, so it's always safe to
 * call these from anywhere in the app.
 */

const DISTINCT_ID_KEY = "gb_distinct_id";

function getDistinctId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(DISTINCT_ID_KEY);
    if (!id) {
      id = "anon_" + crypto.randomUUID();
      localStorage.setItem(DISTINCT_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon_unknown";
  }
}

function send(body: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // never let analytics failures affect the app
    });
  } catch {
    // ignore
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  send({ event, properties, distinctId: getDistinctId() });
}

export function identifyUser(userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISTINCT_ID_KEY, userId);
  } catch {
    // ignore
  }
}

export function setUserProperties(properties: Record<string, unknown>) {
  send({ kind: "profile", distinctId: getDistinctId(), setProps: properties });
}

export function resetMixpanelUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DISTINCT_ID_KEY);
  } catch {
    // ignore
  }
}
