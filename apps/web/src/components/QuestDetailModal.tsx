"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, type Hash } from "viem";
import { toast } from "sonner";
import { getDifficultyLabel, getDifficultyColor, formatAddress } from "@/lib/utils";
import { useHasCompletedQuest } from "@/lib/hooks";
import { fireQuestComplete } from "@/lib/confetti";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Quest Detail Modal — shows quest info and provides "Play" action
 * for end-to-end quest completion flow:
 *   1. User clicks "Play" → sends tx to game contract
 *   2. Indexer detects event → generates proof
 *   3. Proof submitted on-chain → XP awarded
 *   4. UI updates via polling / toast notification
 */

interface Quest {
  id: number;
  title?: string;
  description?: string;
  xpReward: number;
  difficulty: number;
  gameName?: string;
  targetContract?: string;
  eventSig?: string;
  cooldown?: number;
  completed?: boolean;
}

interface QuestDetailModalProps {
  quest: Quest;
  onClose: () => void;
}

// MockGame ABI — each function triggers an event the indexer watches
const mockGameAbi = parseAbi([
  "function winMatch()",
  "function mintGameNFT(uint256 tokenId)",
  "function defeatBoss(uint256 bossId)",
  "function craftItem(uint256 itemId)",
]);

// Map event signatures to MockGame function calls
const EVENT_TO_ACTION: Record<string, { functionName: string; label: string; args?: readonly unknown[] }> = {};

function getQuestAction(eventSig?: string) {
  if (!eventSig) return { functionName: "winMatch" as const, label: "Play Match", args: [] as const };

  const sigLower = eventSig.toLowerCase();

  // keccak256("MatchWon(address)")
  if (sigLower.includes("d11d6")) return { functionName: "winMatch" as const, label: "Play Match", args: [] as const };
  // keccak256("NFTMinted(address,uint256)")
  if (sigLower.includes("4c209")) return { functionName: "mintGameNFT" as const, label: "Mint NFT", args: [BigInt(1)] as const };
  // keccak256("BossDefeated(address,uint256)")
  if (sigLower.includes("e6af1")) return { functionName: "defeatBoss" as const, label: "Fight Boss", args: [BigInt(1)] as const };
  // keccak256("ItemCrafted(address,uint256)")
  if (sigLower.includes("f3f1e")) return { functionName: "craftItem" as const, label: "Craft Item", args: [BigInt(1)] as const };

  return { functionName: "winMatch" as const, label: "Complete Quest", args: [] as const };
}

export function QuestDetailModal({ quest, onClose }: QuestDetailModalProps) {
  const { address, isConnected } = useAccount();
  const { data: hasCompleted } = useHasCompletedQuest(address, quest.id);
  const isCompleted = quest.completed || hasCompleted;

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [awaitingProof, setAwaitingProof] = useState(false);
  const action = getQuestAction(quest.eventSig);
  const diffColor = getDifficultyColor(quest.difficulty);
  const diffLabel = getDifficultyLabel(quest.difficulty);

  // Handle tx confirmation → wait for indexer proof
  useEffect(() => {
    if (isSuccess && txHash) {
      toast.success("Transaction confirmed! Awaiting proof verification...", {
        description: `TX: ${formatAddress(txHash)}`,
      });
      setAwaitingProof(true);
      // #3 — Confetti on quest action confirmed
      fireQuestComplete();

      // Poll for completion (indexer picks up event → submits proof → XP awarded)
      const interval = setInterval(async () => {
        // After a reasonable delay, show success
        // In production, we'd poll the API or listen via WebSocket
      }, 3000);

      // Auto-clear after 30s
      const timeout = setTimeout(() => {
        setAwaitingProof(false);
        toast.info("Proof processing may take a moment. Check your dashboard for updates.");
        clearInterval(interval);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isSuccess, txHash]);

  useEffect(() => {
    if (writeError) {
      toast.error("Transaction failed", { description: writeError.message.slice(0, 100) });
    }
  }, [writeError]);

  function handlePlay() {
    if (!quest.targetContract) {
      toast.error("Quest target contract not configured");
      return;
    }

    writeContract({
      address: quest.targetContract as `0x${string}`,
      abi: mockGameAbi,
      functionName: action.functionName as any,
      args: action.args as any,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-arena-bg border border-arena-border rounded-2xl max-w-lg w-full p-8 shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          {quest.gameName && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {quest.gameName}
            </span>
          )}
          <h2 className="text-2xl font-bold text-white mt-1">
            {quest.title || `Quest #${quest.id}`}
          </h2>
          {quest.description && (
            <p className="text-gray-400 mt-2">{quest.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-arena-card rounded-xl p-4 text-center border border-arena-border">
            <div className="text-2xl font-bold text-arena-gold">⚡ {quest.xpReward}</div>
            <div className="text-xs text-gray-500 mt-1">XP Reward</div>
          </div>
          <div className="bg-arena-card rounded-xl p-4 text-center border border-arena-border">
            <div className="text-2xl font-bold" style={{ color: diffColor }}>
              {diffLabel}
            </div>
            <div className="text-xs text-gray-500 mt-1">Difficulty</div>
          </div>
          <div className="bg-arena-card rounded-xl p-4 text-center border border-arena-border">
            <div className="text-2xl font-bold text-white">
              {quest.cooldown ? `${Math.floor((quest.cooldown || 0) / 3600)}h` : "∞"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Cooldown</div>
          </div>
        </div>

        {/* Contract info */}
        {quest.targetContract && (
          <div className="mb-6 text-xs text-gray-600 bg-arena-card rounded-lg p-3 border border-arena-border font-mono">
            <div>Contract: {formatAddress(quest.targetContract)}</div>
            {quest.eventSig && <div>Event: {formatAddress(quest.eventSig)}</div>}
          </div>
        )}

        {/* Status / Action */}
        <div className="space-y-3">
          {isCompleted ? (
            <div className="w-full bg-green-500/10 text-green-400 py-4 rounded-xl text-center font-medium border border-green-500/20">
              ✓ Quest Completed
            </div>
          ) : !isConnected ? (
            <div className="w-full bg-arena-card text-gray-400 py-4 rounded-xl text-center font-medium border border-arena-border">
              Connect wallet to play
            </div>
          ) : awaitingProof ? (
            <div className="w-full bg-arena-accent/10 text-arena-accent py-4 rounded-xl text-center font-medium border border-arena-accent/20 animate-pulse">
              ⏳ Awaiting proof verification...
            </div>
          ) : (
            <button
              onClick={handlePlay}
              disabled={isPending || isConfirming}
              className="w-full bg-arena-accent text-white py-4 rounded-xl font-medium hover:bg-arena-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Confirm in Wallet..."
                : isConfirming
                ? "Confirming..."
                : `🎮 ${action.label}`}
            </button>
          )}
        </div>

        {/* TX link */}
        {txHash && (
          <div className="mt-4 text-center">
            <a
              href={`https://testnet.snowtrace.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-arena-accent hover:underline"
            >
              View on Snowtrace ↗
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
