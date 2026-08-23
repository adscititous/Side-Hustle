"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) so the app can be installed
 * to the home screen. Only runs in production — a service worker in dev
 * would cache stale builds and fight with hot reload.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a nice-to-have — never let this break the app.
    });
  }, []);

  return null;
}
