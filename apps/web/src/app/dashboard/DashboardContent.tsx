"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { IdentityCard } from "@/components/IdentityCard";
import { QuestCard } from "@/components/QuestCard";
import { usePlayerStats } from "@/lib/hooks";
import { fetchPlayerQuests, fetchQuests } from "@/lib/api";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface QuestData {
  id: number;
  title?: string;
  description?: string;
  xpReward: number;
  difficulty: number;
  gameName?: string;
  completed?: boolean;
}

export default function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { stats, isLoading: statsLoading } = usePlayerStats(address);
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [allQuests, playerQuests] = await Promise.allSettled([
          fetchQuests(),
          address ? fetchPlayerQuests(address) : Promise.resolve([]),
        ]);

        if (allQuests.status === "fulfilled") {
          setQuests(allQuests.value || []);
        }

        if (playerQuests.status === "fulfilled" && playerQuests.value) {
          const ids = new Set<number>(
            (playerQuests.value as any[]).map((q: any) => q.questId || q.quest_id || q.id)
          );
          setCompletedQuestIds(ids);
        }
      } catch {
        // API might not be running — show empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [address]);

  // Merge completion status into quests
  const questsWithCompletion = quests.map((q) => ({
    ...q,
    completed: completedQuestIds.has(q.id),
  }));

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6">🎮</div>
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to Avalanche Arena</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Connect your wallet to view your cross-game progression, quest completions, and evolving identity.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Your cross-game progression overview</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity Card */}
        <div className="lg:col-span-1">
          {statsLoading ? (
            <div className="animate-pulse bg-arena-card rounded-2xl h-64 border border-arena-border" />
          ) : (
            <IdentityCard
              address={address!}
              level={stats?.level ?? 0}
              xp={stats?.xp ?? 0}
              questsCompleted={stats?.questsCompleted ?? 0}
              streak={stats?.streak ?? 0}
              faction=""
            />
          )}

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-arena-card rounded-xl border border-arena-border">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Progress Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total XP</span>
                <span className="text-white font-medium">
                  {stats?.xp?.toLocaleString() ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Level</span>
                <span className="text-white font-medium">{stats?.level ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Quests Completed</span>
                <span className="text-white font-medium">
                  {stats?.questsCompleted ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Streak</span>
                <span className="text-arena-gold font-medium">
                  {stats?.streak ?? 0} 🔥
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quest Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Active Quests</h2>
            <a href="/quests" className="text-arena-accent text-sm hover:underline">
              View All →
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-arena-card rounded-xl h-40 border border-arena-border"
                />
              ))}
            </div>
          ) : questsWithCompletion.length === 0 ? (
            <div className="text-center py-12 bg-arena-card rounded-xl border border-arena-border">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-gray-400">No quests available yet.</p>
              <p className="text-gray-600 text-sm mt-1">
                Quests appear after deployment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questsWithCompletion.slice(0, 6).map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
