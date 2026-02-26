import { CHAIN_CONFIG } from "./contracts";

/**
 * API client for Arena backend
 */

const BASE_URL = CHAIN_CONFIG.apiUrl;

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Unknown API error");
  }
  return data.data;
}

// Player
export async function fetchPlayer(address: string) {
  return fetchAPI<any>(`/player/${address}`);
}

export async function fetchPlayerQuests(address: string) {
  return fetchAPI<any[]>(`/player/${address}/quests`);
}

// Quests
export async function fetchQuests(params?: { limit?: number; offset?: number; difficulty?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.difficulty) searchParams.set("difficulty", params.difficulty.toString());
  const qs = searchParams.toString();
  return fetchAPI<any[]>(`/quests${qs ? `?${qs}` : ""}`);
}

export async function fetchQuest(id: number) {
  return fetchAPI<any>(`/quests/${id}`);
}

// Leaderboard
export async function fetchLeaderboard(limit: number = 100, cursor?: string) {
  const searchParams = new URLSearchParams({ limit: limit.toString() });
  if (cursor) searchParams.set("cursor", cursor);
  return fetchAPI<any[]>(`/leaderboard?${searchParams}`);
}

export async function fetchGlobalStats() {
  return fetchAPI<any>("/leaderboard/stats");
}

// Achievements
export async function fetchAchievements(address?: string) {
  const endpoint = address
    ? `/achievements/player/${address}`
    : "/achievements";
  return fetchAPI<any[]>(endpoint);
}

export async function checkAchievements(address: string) {
  return fetchAPI<any>(`/achievements/check/${address}`, { method: "POST" });
}

// Transactions
export async function fetchTransactions(address: string, params?: { limit?: number; offset?: number; type?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.type) searchParams.set("type", params.type);
  const qs = searchParams.toString();
  return fetchAPI<any[]>(`/transactions/${address}${qs ? `?${qs}` : ""}`);
}

// Auth (SIWE)
export async function fetchNonce() {
  return fetchAPI<{ nonce: string }>("/auth/nonce");
}

export async function verifySignature(message: string, signature: string) {
  return fetchAPI<{ token: string; address: string; expiresAt: string }>("/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
}

// Admin / Analytics
export async function fetchAnalytics() {
  return fetchAPI<any>("/admin/analytics");
}
