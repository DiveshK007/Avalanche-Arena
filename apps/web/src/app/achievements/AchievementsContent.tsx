"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CHAIN_CONFIG } from "@/lib/contracts";
import { toast } from "sonner";

/**
 * Achievements Page (#29)
 *
 * Displays all achievements and which ones the player has earned.
 */

interface Achievement {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  earned: boolean;
  earned_at?: string;
}

export default function AchievementsContent() {
  const { address, isConnected } = useAccount();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const endpoint = address
          ? `${CHAIN_CONFIG.apiUrl}/achievements/player/${address}`
          : `${CHAIN_CONFIG.apiUrl}/achievements`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.success) setAchievements(data.data);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [address]);

  async function checkAchievements() {
    if (!address) return;
    setChecking(true);
    try {
      const res = await fetch(`${CHAIN_CONFIG.apiUrl}/achievements/check/${address}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.data.newAchievements.length > 0) {
        for (const a of data.data.newAchievements) {
          toast.success(`🏆 Achievement Unlocked: ${a.title}`);
        }
        // Reload achievements
        const reloadRes = await fetch(`${CHAIN_CONFIG.apiUrl}/achievements/player/${address}`);
        const reloadData = await reloadRes.json();
        if (reloadData.success) setAchievements(reloadData.data);
      } else {
        toast.info("No new achievements to claim.");
      }
    } catch {
      toast.error("Failed to check achievements");
    }
    setChecking(false);
  }

  const earned = achievements.filter((a) => a.earned);
  const unearned = achievements.filter((a) => !a.earned);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6">🏆</div>
        <h1 className="text-3xl font-bold text-white mb-4">Achievements</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Connect your wallet to view your achievements.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-gray-500">
            {earned.length} of {achievements.length} unlocked
          </p>
        </div>
        <button
          onClick={checkAchievements}
          disabled={checking}
          className="bg-arena-accent text-white px-6 py-2 rounded-lg hover:bg-arena-accent/80 transition-colors disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check Progress"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-arena-card rounded-full overflow-hidden border border-arena-border mb-8">
        <div
          className="h-full rounded-full bg-arena-gold transition-all duration-1000"
          style={{ width: `${achievements.length > 0 ? (earned.length / achievements.length) * 100 : 0}%` }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-arena-card rounded-xl h-32 border border-arena-border" />
          ))}
        </div>
      ) : (
        <>
          {/* Earned */}
          {earned.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-white mb-4">✅ Unlocked</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {earned.map((a) => (
                  <div key={a.id} className="p-5 bg-arena-card rounded-xl border border-arena-green/30 relative">
                    <div className="absolute top-3 right-3 text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">
                      ✓ Earned
                    </div>
                    <div className="text-3xl mb-2">{a.icon}</div>
                    <h3 className="text-white font-semibold mb-1">{a.title}</h3>
                    <p className="text-sm text-gray-400">{a.description}</p>
                    {a.earned_at && (
                      <p className="text-xs text-gray-600 mt-2">
                        Earned {new Date(a.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Locked */}
          {unearned.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-white mb-4">🔒 Locked</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unearned.map((a) => (
                  <div key={a.id} className="p-5 bg-arena-card rounded-xl border border-arena-border opacity-60">
                    <div className="text-3xl mb-2 grayscale">{a.icon}</div>
                    <h3 className="text-white font-semibold mb-1">{a.title}</h3>
                    <p className="text-sm text-gray-400">{a.description}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Requires: {a.requirement_type.replace("_", " ")} ≥ {a.requirement_value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {achievements.length === 0 && (
            <div className="text-center py-16 bg-arena-card rounded-xl border border-arena-border">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-gray-400">No achievements available yet.</p>
              <p className="text-gray-600 text-sm mt-1">Run database migrations to seed achievements.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
