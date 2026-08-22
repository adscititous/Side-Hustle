import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { clerkUserId, email } = await request.json();

    if (!clerkUserId || !email) {
      return NextResponse.json(
        { error: "clerkUserId and email are required" },
        { status: 400 },
      );
    }

    const { userId } = await auth();

    if (!userId || userId !== clerkUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("PROFILE ENSURE ERROR: SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { error: "Server misconfiguration: missing service role key" },
        { status: 500 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const pseudonymSuffix = crypto.randomUUID().slice(0, 4).toUpperCase();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: crypto.randomUUID(),
        clerk_id: clerkUserId,
        display_name: email.split("@")[0],
        pseudonym_id: `Student#${pseudonymSuffix}`,
        is_anonymous: true,
      },
      { onConflict: "clerk_id", ignoreDuplicates: true },
    );

    if (error) {
      console.error("PROFILE UPSERT ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PROFILE ENSURE UNHANDLED ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 },
    );
  }
}
