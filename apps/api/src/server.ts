import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { validateEnv } from "./env";
import { questsRouter } from "./routes/quests";
import { playerRouter } from "./routes/player";
import { leaderboardRouter } from "./routes/leaderboard";
import { authRouter } from "./routes/auth";
import { achievementsRouter } from "./routes/achievements";
import { transactionsRouter } from "./routes/transactions";
import { adminRouter } from "./routes/admin";
import { generalLimiter, authLimiter } from "./middleware/rateLimit";
import { initWebSocket, getClientCount } from "./services/websocket";

// Validate environment on startup
const env = validateEnv();

const app = express();
const PORT = env.API_PORT;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Global rate limiter
app.use(generalLimiter);

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "arena-api",
    version: "0.2.0",
    wsClients: getClientCount(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/auth", authLimiter, authRouter);
app.use("/quests", questsRouter);
app.use("/player", playerRouter);
app.use("/leaderboard", leaderboardRouter);
app.use("/achievements", achievementsRouter);
app.use("/transactions", transactionsRouter);
app.use("/admin", adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Create HTTP server and attach WebSocket
const server = createServer(app);
initWebSocket(server);

// Only listen if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log("═".repeat(50));
    console.log(`🔺 Arena API v0.2.0 running on http://localhost:${PORT}`);
    console.log(`   Auth:     SIWE + JWT`);
    console.log(`   Cache:    Redis`);
    console.log(`   Limits:   100 req/min`);
    console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
    console.log("═".repeat(50));
  });
}

export default app;
