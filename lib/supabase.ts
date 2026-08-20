import { createBrowserClient } from "@supabase/ssr";

type ClerkSession = { getToken: () => Promise<string | null> } | null | undefined;

export function createClient(session: ClerkSession) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: false,
      async accessToken() {
        return (await session?.getToken()) ?? null;
      },
    },
  );
}
