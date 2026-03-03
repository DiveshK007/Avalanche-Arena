"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import {
  useHasMinted,
  usePlayerTokenId,
  useIdentity,
  useTokenURI,
  useMintIdentity,
  useSetFaction,
  usePlayerStats,
} from "@/lib/hooks";
import { getTier, getTierColor } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { fireMintSuccess } from "@/lib/confetti";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion } from "framer-motion";

const FACTIONS = [
  { name: "Frostborn", color: "#4a9eff", icon: "❄️", desc: "Masters of ice and patience" },
  { name: "Inferno", color: "#e74c3c", icon: "🔥", desc: "Wielders of fire and fury" },
  { name: "Shadow", color: "#8e44ad", icon: "🌑", desc: "Dwellers of the unseen" },
  { name: "Aether", color: "#f1c40f", icon: "⚡", desc: "Channelers of pure energy" },
];

const TIERS = [
  { tier: "Novice", range: "Level 0-2", color: "#4a9eff" },
  { tier: "Adventurer", range: "Level 3-5", color: "#50c878" },
  { tier: "Warrior", range: "Level 6-9", color: "#ff6b35" },
  { tier: "Champion", range: "Level 10-14", color: "#9b59b6" },
  { tier: "Legend", range: "Level 15-24", color: "#f1c40f" },
  { tier: "Mythic", range: "Level 25+", color: "#e74c3c" },
];

export default function IdentityContent() {
  const { address, isConnected } = useAccount();
  const { data: hasMinted, refetch: refetchMinted } = useHasMinted(address);
  const { data: tokenId, refetch: refetchTokenId } = usePlayerTokenId(address);
  const { identity, refetch: refetchIdentity } = useIdentity(tokenId as bigint | undefined);
  const { data: tokenURI } = useTokenURI(tokenId as bigint | undefined);
  const { stats } = usePlayerStats(address);
  const { mint, isPending: mintPending, isConfirming: mintConfirming, isSuccess: mintSuccess, error: mintError } = useMintIdentity();
  const { setFaction, isPending: factionPending, isConfirming: factionConfirming, isSuccess: factionSuccess, error: factionError } = useSetFaction();

  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);

  // Refetch data after successful mint
  useEffect(() => {
    if (mintSuccess) {
      fireMintSuccess();
      setTimeout(() => {
        refetchMinted();
        refetchTokenId();
      }, 2000);
    }
  }, [mintSuccess, refetchMinted, refetchTokenId]);

  // Refetch identity after faction change
  useEffect(() => {
    if (factionSuccess) {
      setTimeout(() => refetchIdentity(), 2000);
    }
  }, [factionSuccess, refetchIdentity]);

  // Parse on-chain SVG from tokenURI (base64 encoded JSON)
  const nftImageSrc = tokenURI
    ? (() => {
        try {
          const json = JSON.parse(atob((tokenURI as string).split(",")[1]));
          return json.image;
        } catch {
          return null;
        }
      })()
    : null;

  const currentTier = stats ? getTier(stats.level) : "Novice";
  const currentTierColor = stats ? getTierColor(stats.level) : "#4a9eff";

  if (!isConnected) {
    return (
      <EmptyState
        icon="🎭"
        title="Your Arena Identity"
        description="Connect your wallet to mint, evolve, and manage your on-chain gaming identity."
      />
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Your Identity</h1>
      <p className="text-gray-500 mb-8">
        Your evolving on-chain gaming identity
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NFT Preview */}
        <div className="flex items-center justify-center p-8 bg-arena-card border border-arena-border rounded-2xl">
          {hasMinted && nftImageSrc ? (
            <img
              src={nftImageSrc}
              alt="Arena Identity NFT"
              className="w-full max-w-sm rounded-xl border border-arena-border"
            />
          ) : hasMinted ? (
            <div className="w-full max-w-sm aspect-[4/5] bg-gradient-to-br from-arena-blue/20 to-arena-purple/20 rounded-xl flex items-center justify-center border border-arena-border">
              <div className="text-center">
                <div className="text-6xl mb-4">🎭</div>
                <div className="text-white font-bold text-xl mb-2">Identity Minted!</div>
                <div className="text-gray-500 text-sm">
                  Level {stats?.level ?? 0} · {currentTier}
                </div>
                <div
                  className="mt-3 text-sm font-medium"
                  style={{ color: currentTierColor }}
                >
                  {identity?.faction || "Unaligned"}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm aspect-[4/5] bg-gradient-to-br from-arena-blue/20 to-arena-purple/20 rounded-xl flex items-center justify-center border border-arena-border">
              <div className="text-center">
                <div className="text-6xl mb-4">🎭</div>
                <div className="text-white font-bold text-xl mb-2">Dynamic Identity NFT</div>
                <div className="text-gray-500 text-sm">Mint your identity below</div>
                <div className="text-gray-600 text-xs mt-4">
                  On-chain SVG that evolves with your level
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Identity Details */}
        <div className="space-y-6">
          {/* Mint Section */}
          {!hasMinted && (
            <div className="p-6 bg-arena-card border border-arena-border rounded-xl">
              <h3 className="text-lg font-bold text-white mb-3">Mint Your Identity</h3>
              <p className="text-sm text-gray-400 mb-4">
                Each wallet can mint one Arena Identity NFT. This NFT evolves as you
                complete quests and earn XP across the Avalanche ecosystem.
              </p>
              <button
                onClick={() => mint()}
                disabled={mintPending || mintConfirming}
                className="w-full bg-arena-accent text-white py-3 rounded-lg font-medium hover:bg-arena-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mintPending
                  ? "Confirm in Wallet..."
                  : mintConfirming
                  ? "Minting..."
                  : "Mint Identity NFT"}
              </button>
              {mintSuccess && (
                <p className="mt-2 text-sm text-green-400">✓ Identity minted successfully!</p>
              )}
              {mintError && (
                <p className="mt-2 text-sm text-red-400">
                  Error: {(mintError as any)?.shortMessage || mintError.message}
                </p>
              )}
            </div>
          )}

          {/* Identity Stats (if minted) */}
          {hasMinted && identity && (
            <div className="p-6 bg-arena-card border border-arena-border rounded-xl">
              <h3 className="text-lg font-bold text-white mb-4">Identity Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: currentTierColor }}>
                    {identity.level}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Level</div>
                </div>
                <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {identity.totalXP.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total XP</div>
                </div>
                <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{identity.questsCompleted}</div>
                  <div className="text-xs text-gray-500 mt-1">Quests</div>
                </div>
                <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: currentTierColor }}>
                    {currentTier}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Tier</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Minted {new Date(identity.mintedAt * 1000).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Faction Selection */}
          <div className="p-6 bg-arena-card border border-arena-border rounded-xl">
            <h3 className="text-lg font-bold text-white mb-3">
              {hasMinted ? "Change Faction" : "Choose Faction"}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {identity?.faction && identity.faction !== ""
                ? `Currently aligned with ${identity.faction}. You can change your faction at any time.`
                : "Align with a faction to join like-minded players."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FACTIONS.map((faction) => {
                const isCurrentFaction = identity?.faction === faction.name;
                const isSelected = selectedFaction === faction.name;

                return (
                  <button
                    key={faction.name}
                    onClick={() => setSelectedFaction(faction.name)}
                    disabled={!hasMinted}
                    className={`p-3 rounded-lg border transition-all text-left
                      ${isCurrentFaction
                        ? "border-opacity-70 bg-opacity-10"
                        : isSelected
                        ? "border-opacity-50 bg-opacity-5"
                        : "border-arena-border hover:border-opacity-50"
                      }
                      ${!hasMinted ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    style={{
                      borderColor: isCurrentFaction || isSelected ? faction.color : undefined,
                      backgroundColor:
                        isCurrentFaction || isSelected ? `${faction.color}10` : undefined,
                    }}
                  >
                    <div className="text-2xl mb-1">{faction.icon}</div>
                    <div className="text-sm font-medium text-white">
                      {faction.name}
                      {isCurrentFaction && (
                        <span className="ml-1 text-xs opacity-60">(current)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{faction.desc}</div>
                  </button>
                );
              })}
            </div>

            {hasMinted && selectedFaction && selectedFaction !== identity?.faction && (
              <button
                onClick={() => setFaction(selectedFaction)}
                disabled={factionPending || factionConfirming}
                className="mt-4 w-full bg-arena-accent text-white py-3 rounded-lg font-medium hover:bg-arena-accent/80 transition-colors disabled:opacity-50"
              >
                {factionPending
                  ? "Confirm in Wallet..."
                  : factionConfirming
                  ? "Setting Faction..."
                  : `Join ${selectedFaction}`}
              </button>
            )}
            {factionSuccess && (
              <p className="mt-2 text-sm text-green-400">✓ Faction updated!</p>
            )}
            {factionError && (
              <p className="mt-2 text-sm text-red-400">
                Error: {(factionError as any)?.shortMessage || factionError.message}
              </p>
            )}
          </div>

          {/* Tier Progression */}
          <div className="p-6 bg-arena-card border border-arena-border rounded-xl">
            <h3 className="text-lg font-bold text-white mb-3">Tier Progression</h3>
            <div className="space-y-2">
              {TIERS.map((t) => {
                const isCurrentTier = currentTier === t.tier;

                return (
                  <div
                    key={t.tier}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isCurrentTier ? "bg-arena-bg/50" : ""
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${isCurrentTier ? "ring-2 ring-offset-1 ring-offset-arena-card" : ""}`}
                      style={{
                        backgroundColor: t.color,
                      }}
                    />
                    <span
                      style={{ color: t.color }}
                      className="text-sm font-medium w-24"
                    >
                      {t.tier}
                    </span>
                    <span className="text-xs text-gray-500">{t.range}</span>
                    {isCurrentTier && (
                      <span className="ml-auto text-xs text-arena-accent">← You</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
