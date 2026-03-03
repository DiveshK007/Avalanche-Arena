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
            <footer className="border-t border-arena-border/50 mt-20 py-12 pb-24 md:pb-12 relative overflow-hidden">
              {/* Subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-arena-accent/[0.02] to-transparent pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔺</span>
                    <div>
                      <div className="text-sm font-medium text-white">Avalanche Arena</div>
                      <div className="text-xs text-gray-500">Cross-Game Progression Protocol</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <span>Built on Avalanche C-Chain</span>
                    <span className="w-1 h-1 rounded-full bg-arena-border" />
                    <a
                      href="https://github.com/DiveshK007/Avalanche-Arena"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-arena-accent transition-colors"
                    >
                      GitHub ↗
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
