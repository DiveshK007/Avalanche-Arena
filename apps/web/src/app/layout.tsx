import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LayoutShell } from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Avalanche Arena | Cross-Game Progression Protocol",
  description:
    "Avalanche Arena is a cross-game quest and identity layer that turns on-chain activity into progression — where your wallet becomes a character that levels up across the entire Avalanche ecosystem.",
  keywords: ["avalanche", "arena", "gaming", "web3", "nft", "quest", "blockchain"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-arena-bg text-gray-200 min-h-screen font-mono">
        <Providers>
          <LayoutShell>
            <Navbar />
            <main>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>

            {/* Footer */}
            <footer className="border-t border-arena-border mt-20 py-8 pb-20 md:pb-8">
              <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
                <p>🔺 Avalanche Arena — Cross-Game Progression Protocol</p>
                <p className="mt-1">Built on Avalanche C-Chain</p>
              </div>
            </footer>
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
