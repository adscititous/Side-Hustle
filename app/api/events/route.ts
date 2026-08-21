import { NextResponse } from "next/server";

/**
 * Server-side proxy for Mixpanel. The browser never talks to mxpnl.com /
 * api.mixpanel.com directly — it POSTs here, and this route forwards to
 * Mixpanel from the server. Ad-blockers and DNS-level tracker blockers
 * (extremely common on students' phones) block those domains by name,
 * which was silently dropping 100% of events under the old client-side
 * <script src="https://cdn.mxpnl.com/..."> setup. Routing through our own
 * domain sidesteps that — nothing here is recognizable as a tracker.
 */

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export async function POST(request: Request) {
  if (!MIXPANEL_TOKEN) {
    return NextResponse.json({ skipped: true });
  }

  try {
    const body = await request.json();
    const { kind, event, properties, distinctId, setProps } = body ?? {};

    if (!distinctId) {
      return NextResponse.json({ error: "distinctId is required" }, { status: 400 });
    }

    if (kind === "profile") {
      await fetch("https://api.mixpanel.com/engage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            $token: MIXPANEL_TOKEN,
            $distinct_id: distinctId,
            $set: setProps ?? {},
          },
        ]),
      });
      return NextResponse.json({ ok: true });
    }

    if (!event) {
      return NextResponse.json({ error: "event is required" }, { status: 400 });
    }

    await fetch("https://api.mixpanel.com/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          event,
          properties: {
            ...properties,
            token: MIXPANEL_TOKEN,
            distinct_id: distinctId,
            time: Math.floor(Date.now() / 1000),
          },
        },
      ]),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("EVENTS PROXY ERROR:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
