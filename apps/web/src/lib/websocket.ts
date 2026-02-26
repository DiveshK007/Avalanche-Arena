"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatAddress } from "./utils";

/**
 * React hook for Arena WebSocket real-time events
 *
 * Connects to ws://api/ws and receives live updates:
 *   - Quest completions
 *   - Level ups
 *   - Leaderboard changes
 */

interface WSEvent {
  type: string;
  data: Record<string, any>;
  timestamp: number;
}

type EventHandler = (event: WSEvent) => void;

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
  .replace("http://", "ws://")
  .replace("https://", "wss://") + "/ws";

export function useArenaWebSocket(options?: {
  onQuestCompleted?: (data: { player: string; questId: number; xpReward: number }) => void;
  onLevelUp?: (data: { player: string; newLevel: number }) => void;
  onProofSubmitted?: (data: { player: string; questId: number; txHash: string }) => void;
  showToasts?: boolean;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const showToasts = options?.showToasts ?? true;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("[WS] Connected to Arena real-time feed");
      };

      ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data);
          setLastEvent(data);

          switch (data.type) {
            case "quest_completed":
              options?.onQuestCompleted?.(data.data as any);
              if (showToasts) {
                toast.success("Quest Completed!", {
                  description: `${formatAddress(data.data.player)} earned ${data.data.xpReward} XP`,
                });
              }
              break;

            case "player_levelup":
              options?.onLevelUp?.(data.data as any);
              if (showToasts) {
                toast("🎉 Level Up!", {
                  description: `${formatAddress(data.data.player)} reached Level ${data.data.newLevel}`,
                });
              }
              break;

            case "proof_submitted":
              options?.onProofSubmitted?.(data.data as any);
              break;

            case "connected":
              // Welcome message — no action needed
              break;
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Reconnect after 5s
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // WebSocket not available — retry later
      reconnectTimeout.current = setTimeout(connect, 10000);
    }
  }, [options?.onQuestCompleted, options?.onLevelUp, options?.onProofSubmitted, showToasts]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, lastEvent };
}
