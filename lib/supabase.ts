import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@clerk/types";

export function createClient(session?: Session | null) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: false,
      accessToken: async () => {
        return (await session?.getToken()) ?? null;
      },
    },
  );
}
