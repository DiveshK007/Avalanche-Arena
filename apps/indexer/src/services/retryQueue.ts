import { logger } from "../logger";

/**
 * Retry Queue — Handles failed proof submissions
 *
 * When a proof submission fails (gas issues, RPC timeouts, etc.),
 * it gets added to this queue for automatic retry with exponential backoff.
 */

interface RetryItem {
  id: string;
  player: string;
  questId: number;
  txHash: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: number;
  lastError?: string;
}

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 5_000;       // 5 seconds
const MAX_DELAY_MS = 300_000;      // 5 minutes
const QUEUE_POLL_MS = 10_000;      // Check queue every 10 seconds

let queue: RetryItem[] = [];
let isProcessing = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

type ProofSubmitFn = (player: string, questId: number, txHash: string) => Promise<boolean>;
let submitFn: ProofSubmitFn | null = null;

/**
 * Initialize the retry queue with a submit function
 */
export function initRetryQueue(submitProof: ProofSubmitFn): void {
  submitFn = submitProof;
  startProcessing();
  logger.info("Retry queue initialized");
}

/**
 * Add a failed proof to the retry queue
 */
export function addToRetryQueue(
  player: string,
  questId: number,
  txHash: string,
  error?: string
): void {
  const id = `${player}-${questId}-${txHash}`;

  // Don't add duplicates
  if (queue.find((item) => item.id === id)) {
    logger.debug("Item already in retry queue", { id });
    return;
  }

  const item: RetryItem = {
    id,
    player,
    questId,
    txHash,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    nextRetryAt: Date.now() + BASE_DELAY_MS,
    createdAt: Date.now(),
    lastError: error,
  };

  queue.push(item);
  logger.info("Added to retry queue", {
    player: player.slice(0, 10) + "...",
    questId,
    queueSize: queue.length,
  });
}

/**
 * Start the retry queue processor
 */
function startProcessing(): void {
  if (intervalId) return;

  intervalId = setInterval(processQueue, QUEUE_POLL_MS);
  logger.debug("Retry queue processor started", { pollInterval: QUEUE_POLL_MS });
}

/**
 * Stop the retry queue processor
 */
export function stopRetryQueue(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  logger.info("Retry queue stopped", { pendingItems: queue.length });
}

/**
 * Process all ready items in the queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || !submitFn || queue.length === 0) return;

  isProcessing = true;
  const now = Date.now();

  // Get items ready to retry
  const readyItems = queue.filter((item) => item.nextRetryAt <= now);

  for (const item of readyItems) {
    item.attempts++;

    logger.info("Retrying proof submission", {
      player: item.player.slice(0, 10) + "...",
      questId: item.questId,
      attempt: item.attempts,
      maxAttempts: item.maxAttempts,
    });

    try {
      const success = await submitFn(item.player, item.questId, item.txHash);

      if (success) {
        // Remove from queue
        queue = queue.filter((q) => q.id !== item.id);
        logger.info("Retry successful, removed from queue", {
          player: item.player.slice(0, 10) + "...",
          questId: item.questId,
          totalAttempts: item.attempts,
        });
      } else {
        handleRetryFailure(item, "Submission returned false");
      }
    } catch (error: any) {
      handleRetryFailure(item, error.message);
    }
  }

  isProcessing = false;
}

/**
 * Handle a failed retry attempt
 */
function handleRetryFailure(item: RetryItem, error: string): void {
  item.lastError = error;

  if (item.attempts >= item.maxAttempts) {
    // Max attempts reached — remove from queue and log as dead letter
    queue = queue.filter((q) => q.id !== item.id);
    logger.error("Proof submission permanently failed (max retries reached)", {
      player: item.player,
      questId: item.questId,
      txHash: item.txHash,
      totalAttempts: item.attempts,
      lastError: error,
    });
  } else {
    // Exponential backoff: 5s, 10s, 20s, 40s, 80s (capped at MAX_DELAY_MS)
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, item.attempts - 1), MAX_DELAY_MS);
    item.nextRetryAt = Date.now() + delay;

    logger.warn("Retry failed, will retry again", {
      player: item.player.slice(0, 10) + "...",
      questId: item.questId,
      attempt: item.attempts,
      nextRetryIn: `${Math.round(delay / 1000)}s`,
      error,
    });
  }
}

/**
 * Get current queue status
 */
export function getRetryQueueStatus(): {
  size: number;
  items: Array<{
    player: string;
    questId: number;
    attempts: number;
    nextRetryAt: number;
  }>;
} {
  return {
    size: queue.length,
    items: queue.map((item) => ({
      player: item.player,
      questId: item.questId,
      attempts: item.attempts,
      nextRetryAt: item.nextRetryAt,
    })),
  };
}
