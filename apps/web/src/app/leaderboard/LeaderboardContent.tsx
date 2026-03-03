"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { fetchLeaderboard, fetchGlobalStats } from "@/lib/api";
import { formatXP } from "@/lib/utils";
import { PageTransition } from "@/components/ui/PageTransition";
import { StatCardSkeleton, LeaderboardRowSkeleton } from "@/components/ui/Skeleton";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  address: string;
  total_xp: number;
  level: number;
  quests_completed: number;
}

interface GlobalStats {
  totalPlayers?: number;
  activeQuests?: number;
  totalCompletions?: number;
  totalXP?: number;
}

export default function LeaderboardContent() {
  const { address } = useAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [leaderboard, stats] = await Promise.allSettled([
          fetchLeaderboard(100),
          fetchGlobalStats(),
        ]);

        if (leaderboard.status === "fulfilled") {
          setEntries(leaderboard.value || []);
        }
        if (stats.status === "fulfilled") {
          setGlobalStats(stats.value || {});
        }
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    { label: "Total Players", value: globalStats.totalPlayers?.toLocaleString() ?? "—" },
    { label: "Active Quests", value: globalStats.activeQuests?.toLocaleString() ?? "—" },
    { label: "Total Completions", value: globalStats.totalCompletions?.toLocaleString() ?? "—" },
    { label: "XP Earned", value: globalStats.totalXP ? formatXP(globalStats.totalXP) : "—" },
  ];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-500 mb-8">
          Top players across the Avalanche Arena ecosystem
        </p>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-arena-card border border-arena-border rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-white">
                {loading ? (
                  <span className="inline-block w-12 h-6 animate-pulse bg-arena-border rounded" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="bg-arena-card border border-arena-border rounded-xl p-8">
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <LeaderboardRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-arena-card rounded-xl border border-arena-border">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-400">No players on the leaderboard yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Complete quests to earn XP and climb the ranks!
          </p>
        </div>
      ) : (
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
          <LeaderboardTable entries={entries} highlightAddress={address} />
        </div>
      )}
    </div>
    </PageTransition>
  );
}
