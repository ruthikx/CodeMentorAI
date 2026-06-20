"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <SessionProvider>
      <SessionTokenBridge />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}

function SessionTokenBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session?.apiToken) {
      window.localStorage.setItem("codementor_token", session.apiToken);
      return;
    }

    if (status === "unauthenticated") {
      window.localStorage.removeItem("codementor_token");
    }
  }, [session?.apiToken, status]);

  return null;
}
