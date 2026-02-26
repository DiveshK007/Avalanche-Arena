"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";

/**
 * Root client providers — wraps the app with:
 *   1. ThemeProvider (dark/light mode)
 *   2. WagmiProvider (blockchain state)
 *   3. QueryClientProvider (react-query caching)
 *   4. RainbowKitProvider (wallet connect UI)
 *   5. Toaster (sonner toast notifications)
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchInterval: 60_000,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#e84142",
              accentColorForeground: "white",
              borderRadius: "medium",
              fontStack: "system",
              overlayBlur: "small",
            })}
            modalSize="compact"
          >
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              richColors
              toastOptions={{
                style: {
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  color: "#e0e0e0",
                },
              }}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
