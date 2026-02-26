"use client";

import { formatAddress, formatXP, getTier, getTierColor } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  address: string;
  total_xp: number;
  level: number;
  quests_completed: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightAddress?: string;
}

export function LeaderboardTable({ entries, highlightAddress }: LeaderboardTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-arena-border text-gray-500 uppercase text-xs tracking-wider">
            <th className="py-3 px-4 text-left">Rank</th>
            <th className="py-3 px-4 text-left">Player</th>
            <th className="py-3 px-4 text-left">Tier</th>
            <th className="py-3 px-4 text-right">Level</th>
            <th className="py-3 px-4 text-right">XP</th>
            <th className="py-3 px-4 text-right">Quests</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const tier = getTier(entry.level);
            const tierColor = getTierColor(entry.level);
            const isHighlighted = highlightAddress?.toLowerCase() === entry.address.toLowerCase();
            const rank = entry.rank || i + 1;

            return (
              <tr
                key={entry.address}
                className={`
                  border-b border-arena-border/50 transition-colors
                  ${isHighlighted
                    ? "bg-arena-accent/10"
                    : "hover:bg-arena-card/50"
                  }
                `}
              >
                <td className="py-3 px-4">
                  <span className={`font-bold ${rank <= 3 ? "text-arena-gold" : "text-gray-400"}`}>
                    {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-white">
                  {formatAddress(entry.address)}
                  {isHighlighted && (
                    <span className="ml-2 text-xs text-arena-accent">(you)</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${tierColor}20`,
                      color: tierColor,
                    }}
                  >
                    {tier}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-white font-medium">
                  {entry.level}
                </td>
                <td className="py-3 px-4 text-right text-arena-gold">
                  {formatXP(entry.total_xp)}
                </td>
                <td className="py-3 px-4 text-right text-gray-400">
                  {entry.quests_completed}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
