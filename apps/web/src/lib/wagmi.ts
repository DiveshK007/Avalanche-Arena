"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { avalancheFuji, avalanche } from "wagmi/chains";

/**
 * Wagmi + RainbowKit configuration for Avalanche Arena
 *
 * Note: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID must be set in .env
 * A placeholder is used during build to prevent SSR errors.
 */

// Fallback ensures build succeeds; runtime requires the real project ID
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "Avalanche Arena",
  projectId,
  chains: [avalancheFuji, avalanche],
  transports: {
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
    ),
    [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
  },
  ssr: true,
});
