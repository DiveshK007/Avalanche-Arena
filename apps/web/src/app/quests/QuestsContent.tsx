"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { QuestCard } from "@/components/QuestCard";
import { fetchQuests, fetchPlayerQuests } from "@/lib/api";

const DIFFICULTY_FILTERS = [
  { label: "All", value: 0 },
  { label: "Easy", value: 1 },
  { label: "Medium", value: 2 },
  { label: "Hard", value: 3 },
  { label: "Very Hard", value: 4 },
  { label: "Legendary", value: 5 },
];

interface QuestData {
  id: number;
  title?: string;
  description?: string;
  xpReward: number;
  difficulty: number;
  gameName?: string;
  completed?: boolean;
}

export default function QuestsContent() {
  const { address } = useAccount();
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState(0);
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
          setCompletedIds(
            new Set((playerQuests.value as any[]).map((q: any) => q.questId || q.quest_id || q.id))
          );
        }
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [address]);

  const filteredQuests = quests
    .map((q) => ({ ...q, completed: completedIds.has(q.id) }))
    .filter((q) => activeFilter === 0 || q.difficulty === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Quest Feed</h1>
      <p className="text-gray-500 mb-8">
        Discover quests across the Avalanche gaming ecosystem
      </p>

      {/* Filters */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {DIFFICULTY_FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors
              ${activeFilter === filter.value
                ? "bg-arena-accent text-white border-arena-accent"
                : "bg-arena-card text-gray-400 border-arena-border hover:border-gray-500"
              }
            `}
          >
            {filter.label}
            {filter.value > 0 && (
              <span className="ml-1 text-xs opacity-60">
                ({quests.filter((q) => q.difficulty === filter.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-arena-card rounded-xl h-44 border border-arena-border"
            />
          ))}
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="text-center py-16 bg-arena-card rounded-xl border border-arena-border">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-gray-400">
            {activeFilter > 0
              ? "No quests match this difficulty filter."
              : "No quests available yet. Deploy contracts to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {/* Stats bar */}
      {!loading && quests.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
          <span>{quests.length} total quests</span>
          <span>{completedIds.size} completed</span>
          <span>{quests.length - completedIds.size} remaining</span>
        </div>
      )}
    </div>
  );
}
