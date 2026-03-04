"use client";

import { useAccount } from "wagmi";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import CrossChainDashboard from "@/components/CrossChainDashboard";
import ReputationTokenCard from "@/components/ReputationTokenCard";
import PriceFeedWidget from "@/components/PriceFeedWidget";

export default function CrossChainContent() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <EmptyState
        icon="🌐"
        title="Cross-Chain Hub"
        description="Connect your wallet to view cross-chain activity, reputation tokens, and Teleporter messages."
      />
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Cross-Chain Hub</h1>
        <p className="text-gray-500 mb-8">
          Manage your cross-chain reputation, track ICM messages, and bridge ART tokens
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            <CrossChainDashboard />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <ReputationTokenCard />
            <PriceFeedWidget />

            {/* Quick Actions */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  🌉 Bridge ART Tokens
                </button>
                <button className="w-full py-2.5 px-4 bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/15 transition-colors">
                  📡 Register Game L1
                </button>
                <button className="w-full py-2.5 px-4 bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/15 transition-colors">
                  🔄 Sync Reputation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
