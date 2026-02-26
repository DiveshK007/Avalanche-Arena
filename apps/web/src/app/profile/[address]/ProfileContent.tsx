"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { IdentityCard } from "@/components/IdentityCard";
import { fetchPlayer, fetchPlayerQuests } from "@/lib/api";
import { formatAddress, getTier, getTierColor } from "@/lib/utils";
import { usePlayerStats, useHasMinted, usePlayerTokenId, useIdentity } from "@/lib/hooks";
import Link from "next/link";

/**
 * Public Player Profile (#12)
 *
 * View any player's stats, NFT, and quest history.
 * Route: /profile/[address]
 */

interface QuestCompletion {
  quest_id: number;
  title?: string;
  game_name?: string;
  xp_reward?: number;
  completed_at: string;
  tx_hash: string;
}

export default function ProfileContent() {
  const params = useParams();
  const address = params.address as string;
  const { address: connectedAddress } = useAccount();
  const isOwnProfile = connectedAddress?.toLowerCase() === address?.toLowerCase();

  const { stats, isLoading: statsLoading } = usePlayerStats(address as `0x${string}`);
  const { data: hasMinted } = useHasMinted(address as `0x${string}`);
  const { data: tokenId } = usePlayerTokenId(address as `0x${string}`);
  const { identity } = useIdentity(tokenId as bigint | undefined);

  const [playerData, setPlayerData] = useState<any>(null);
  const [completions, setCompletions] = useState<QuestCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    async function load() {
      try {
        setLoading(true);
        const [player, quests] = await Promise.allSettled([
          fetchPlayer(address),
          fetchPlayerQuests(address),
        ]);
        if (player.status === "fulfilled") setPlayerData(player.value);
        if (quests.status === "fulfilled") {
          const completed = (quests.value as any[]).filter((q: any) => q.completed);
          setCompletions(completed);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [address]);

  const tier = stats ? getTier(stats.level) : "Novice";
  const tierColor = stats ? getTierColor(stats.level) : "#4a9eff";

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
             style={{ backgroundColor: `${tierColor}20`, border: `2px solid ${tierColor}` }}>
          🎭
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">
            {formatAddress(address || "")}
            {isOwnProfile && <span className="ml-2 text-sm text-arena-accent">(You)</span>}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span style={{ color: tierColor }} className="font-medium">{tier}</span>
            {identity?.faction && (
              <span className="text-gray-400">· {identity.faction}</span>
            )}
            <span className="text-gray-500">Level {stats?.level ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity Card */}
        <div>
          {statsLoading ? (
            <div className="animate-pulse bg-arena-card rounded-2xl h-64 border border-arena-border" />
          ) : (
            <IdentityCard
              address={address || ""}
              level={stats?.level ?? 0}
              xp={stats?.xp ?? 0}
              questsCompleted={stats?.questsCompleted ?? 0}
              streak={stats?.streak ?? 0}
              faction={identity?.faction || ""}
            />
          )}

          {/* Achievements count */}
          {hasMinted && (
            <div className="mt-4 p-4 bg-arena-card rounded-xl border border-arena-border text-center">
              <div className="text-3xl mb-1">🏆</div>
              <div className="text-sm text-gray-400">
                {hasMinted ? "Identity NFT Minted" : "No Identity Yet"}
              </div>
            </div>
          )}
        </div>

        {/* Quest History */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Quest History</h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-arena-card rounded-xl h-16 border border-arena-border" />
              ))}
            </div>
          ) : completions.length === 0 ? (
            <div className="text-center py-12 bg-arena-card rounded-xl border border-arena-border">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-gray-400">No quests completed yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completions.map((c, i) => (
                <div key={i} className="p-4 bg-arena-card rounded-xl border border-arena-border flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {c.title || `Quest #${c.quest_id}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.game_name && <span>{c.game_name} · </span>}
                      {new Date(c.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-arena-gold font-medium text-sm">
                      +{c.xp_reward || 0} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: "Total XP", value: stats?.xp?.toLocaleString() ?? "0" },
              { label: "Level", value: stats?.level ?? 0 },
              { label: "Quests", value: stats?.questsCompleted ?? 0 },
              { label: "Streak", value: `${stats?.streak ?? 0} 🔥` },
            ].map((s, i) => (
              <div key={i} className="bg-arena-card border border-arena-border rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
