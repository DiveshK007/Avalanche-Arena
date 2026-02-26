import { Router, Request, Response, NextFunction } from "express";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getEnv } from "../env";
import pool from "../db";

export const authRouter = Router();

/**
 * SIWE (Sign-In With Ethereum) Authentication
 *
 * Flow:
 *   1. GET /auth/nonce → returns a random nonce
 *   2. Client signs SIWE message with wallet
 *   3. POST /auth/verify → verifies signature, issues JWT
 *   4. Client sends JWT in Authorization header for protected routes
 */

// ──────────────────────────────────────────
//  GET /auth/nonce
// ──────────────────────────────────────────
authRouter.get("/nonce", (_req: Request, res: Response) => {
  const nonce = uuidv4().replace(/-/g, "");
  res.json({ success: true, data: { nonce } });
});

// ──────────────────────────────────────────
//  POST /auth/verify
// ──────────────────────────────────────────
authRouter.post("/verify", async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      res.status(400).json({ success: false, error: "Missing message or signature" });
      return;
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (!result.success) {
      res.status(401).json({ success: false, error: "Invalid signature" });
      return;
    }

    const address = result.data.address.toLowerCase();
    const env = getEnv();

    // Create session in DB
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO sessions (id, address, nonce, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [sessionId, address, result.data.nonce, expiresAt]
    );

    // Issue JWT
    const token = jwt.sign(
      { sub: address, sid: sessionId },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        token,
        address,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Auth verify error:", error);
    res.status(500).json({ success: false, error: "Authentication failed" });
  }
});

// ──────────────────────────────────────────
//  POST /auth/logout
// ──────────────────────────────────────────
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.json({ success: true });
      return;
    }

    const env = getEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    await pool.query("UPDATE sessions SET is_valid = false WHERE id = $1", [decoded.sid]);

    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// ──────────────────────────────────────────
//  GET /auth/me
// ──────────────────────────────────────────
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const env = getEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Check session validity
    const session = await pool.query(
      "SELECT * FROM sessions WHERE id = $1 AND is_valid = true AND expires_at > NOW()",
      [decoded.sid]
    );

    if (session.rows.length === 0) {
      res.status(401).json({ success: false, error: "Session expired" });
      return;
    }

    res.json({
      success: true,
      data: { address: decoded.sub },
    });
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
});

// ──────────────────────────────────────────
//  Middleware: requireAuth
// ──────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  try {
    const env = getEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    (req as any).user = { address: decoded.sub, sessionId: decoded.sid };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}
