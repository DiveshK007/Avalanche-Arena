import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

/**
 * WebSocket server for real-time event broadcasting
 *
 * Broadcasts to connected frontends:
 *   - quest_completed: when a player completes a quest
 *   - player_levelup: when a player levels up
 *   - leaderboard_update: when leaderboard changes
 *   - new_player: when a new player joins
 */

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export interface WSEvent {
  type: "quest_completed" | "player_levelup" | "leaderboard_update" | "new_player" | "proof_submitted";
  data: Record<string, any>;
  timestamp: number;
}

/**
 * Initialize WebSocket server on existing HTTP server
 */
export function initWebSocket(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: any) => {
    const clientIp = req.socket?.remoteAddress;
    console.log(`[WS] Client connected from ${clientIp}`);
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      data: { message: "Connected to Arena real-time feed", clients: clients.size },
      timestamp: Date.now(),
    }));

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (${clients.size} remaining)`);
    });

    ws.on("error", (err: Error) => {
      console.error("[WS] Client error:", err.message);
      clients.delete(ws);
    });

    // Heartbeat
    ws.on("pong", () => {
      (ws as any).isAlive = true;
    });
  });

  // Heartbeat interval to detect stale connections
  const heartbeat = setInterval(() => {
    wss?.clients.forEach((ws: WebSocket) => {
      if ((ws as any).isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeat);
  });

  console.log("[WS] WebSocket server initialized on /ws");
  return wss;
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast(event: WSEvent): void {
  if (!wss) return;

  const message = JSON.stringify(event);
  let sent = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[WS] Broadcast: ${event.type} to ${sent} clients`);
  }
}

/**
 * Broadcast quest completion
 */
export function broadcastQuestCompleted(player: string, questId: number, xpReward: number): void {
  broadcast({
    type: "quest_completed",
    data: { player, questId, xpReward },
    timestamp: Date.now(),
  });
}

/**
 * Broadcast level up
 */
export function broadcastLevelUp(player: string, newLevel: number): void {
  broadcast({
    type: "player_levelup",
    data: { player, newLevel },
    timestamp: Date.now(),
  });
}

/**
 * Broadcast proof submitted
 */
export function broadcastProofSubmitted(player: string, questId: number, txHash: string): void {
  broadcast({
    type: "proof_submitted",
    data: { player, questId, txHash },
    timestamp: Date.now(),
  });
}

/**
 * Get current client count
 */
export function getClientCount(): number {
  return clients.size;
}
