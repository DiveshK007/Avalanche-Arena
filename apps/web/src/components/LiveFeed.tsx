"use client";

import { useState, useCallback } from "react";
import { useArenaWebSocket } from "@/lib/websocket";
import { formatAddress } from "@/lib/utils";

/**
 * LiveFeed — Real-time activity feed powered by WebSocket
 * Shows latest quest completions, level ups, etc.
 */

interface FeedItem {
  id: string;
  type: string;
  message: string;
  timestamp: number;
}

export function LiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const addItem = useCallback((type: string, message: string) => {
    setFeed((prev) => {
      const item: FeedItem = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: Date.now(),
      };
      return [item, ...prev].slice(0, 20); // Keep last 20 items
    });
  }, []);

  const { isConnected } = useArenaWebSocket({
    showToasts: false,
    onQuestCompleted: (data) => {
      addItem("quest", `${formatAddress(data.player)} completed quest #${data.questId} (+${data.xpReward} XP)`);
    },
    onLevelUp: (data) => {
      addItem("level", `${formatAddress(data.player)} reached Level ${data.newLevel}!`);
    },
    onProofSubmitted: (data) => {
      addItem("proof", `Proof submitted for ${formatAddress(data.player)} — Quest #${data.questId}`);
    },
  });

  const typeIcons: Record<string, string> = {
    quest: "⚡",
    level: "🎉",
    proof: "✅",
  };

  return (
    <div className="bg-arena-card rounded-xl border border-arena-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-arena-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Live Activity</h3>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-600"}`}
          />
          <span className="text-xs text-gray-500">
            {isConnected ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Feed items */}
      <div className="max-h-64 overflow-y-auto">
        {feed.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-sm">
            {isConnected ? "Waiting for activity..." : "Connecting to live feed..."}
          </div>
        ) : (
          <div className="divide-y divide-arena-border/50">
            {feed.map((item) => (
              <div
                key={item.id}
                className="px-4 py-2.5 flex items-start gap-2 text-sm animate-in fade-in slide-in-from-top duration-300"
              >
                <span className="shrink-0">{typeIcons[item.type] || "📌"}</span>
                <span className="text-gray-300 flex-1">{item.message}</span>
                <span className="text-xs text-gray-600 shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
