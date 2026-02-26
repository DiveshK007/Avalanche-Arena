/**
 * Utility functions
 */

export function getTier(level: number): string {
  if (level < 3) return "Novice";
  if (level < 6) return "Adventurer";
  if (level < 10) return "Warrior";
  if (level < 15) return "Champion";
  if (level < 25) return "Legend";
  return "Mythic";
}

export function getTierColor(level: number): string {
  if (level < 3) return "#4a9eff";
  if (level < 6) return "#50c878";
  if (level < 10) return "#ff6b35";
  if (level < 15) return "#9b59b6";
  if (level < 25) return "#f1c40f";
  return "#e74c3c";
}

export function getDifficultyLabel(difficulty: number): string {
  const labels: Record<number, string> = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
    4: "Very Hard",
    5: "Legendary",
  };
  return labels[difficulty] || "Unknown";
}

export function getDifficultyColor(difficulty: number): string {
  const colors: Record<number, string> = {
    1: "#50c878",
    2: "#4a9eff",
    3: "#ff6b35",
    4: "#9b59b6",
    5: "#e74c3c",
  };
  return colors[difficulty] || "#666";
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

export function calculateXPProgress(xp: number, level: number): number {
  const currentLevelXP = level * level * 100;
  const nextLevelXP = (level + 1) * (level + 1) * 100;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.max(0, Math.min(100, progress));
}
