"use client";

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import { CONTRACTS } from "./contracts";

// ──────────────────────────────────────────
//  ABI Definitions (viem format)
// ──────────────────────────────────────────

const playerProgressAbi = parseAbi([
  "function totalXP(address) view returns (uint256)",
  "function level(address) view returns (uint256)",
  "function questsCompleted(address) view returns (uint256)",
  "function streak(address) view returns (uint256)",
  "function getPlayerStats(address player) view returns (uint256 xp, uint256 playerLevel, uint256 completed, uint256 playerStreak)",
  "function hasCompletedQuest(address player, uint256 questId) view returns (bool)",
]);

const identityNFTAbi = parseAbi([
  "function mintIdentity() returns (uint256)",
  "function setFaction(string faction)",
  "function hasMinted(address) view returns (bool)",
  "function playerTokenId(address) view returns (uint256)",
  "function identities(uint256) view returns (uint256 level, uint256 totalXP, uint256 questsCompleted, uint256 mintedAt, string faction)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address) view returns (uint256)",
]);

const questRegistryAbi = parseAbi([
  "function questCount() view returns (uint256)",
  "function getQuest(uint256 questId) view returns (tuple(address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown, bool active))",
  "function isQuestActive(uint256 questId) view returns (bool)",
]);

// ──────────────────────────────────────────
//  Player Stats Hook
// ──────────────────────────────────────────

export function usePlayerStats(address?: `0x${string}`) {
  const contractAddress = CONTRACTS.playerProgress as `0x${string}`;
  const enabled = !!address && !!contractAddress;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: playerProgressAbi,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const stats = data
    ? {
        xp: Number(data[0]),
        level: Number(data[1]),
        questsCompleted: Number(data[2]),
        streak: Number(data[3]),
      }
    : null;

  return { stats, isLoading, error, refetch };
}

// ──────────────────────────────────────────
//  Identity NFT Hooks
// ──────────────────────────────────────────

export function useHasMinted(address?: `0x${string}`) {
  const contractAddress = CONTRACTS.identityNFT as `0x${string}`;
  const enabled = !!address && !!contractAddress;

  return useReadContract({
    address: contractAddress,
    abi: identityNFTAbi,
    functionName: "hasMinted",
    args: address ? [address] : undefined,
    query: { enabled },
  });
}

export function usePlayerTokenId(address?: `0x${string}`) {
  const contractAddress = CONTRACTS.identityNFT as `0x${string}`;
  const enabled = !!address && !!contractAddress;

  return useReadContract({
    address: contractAddress,
    abi: identityNFTAbi,
    functionName: "playerTokenId",
    args: address ? [address] : undefined,
    query: { enabled },
  });
}

export function useIdentity(tokenId?: bigint) {
  const contractAddress = CONTRACTS.identityNFT as `0x${string}`;
  const enabled = tokenId !== undefined && tokenId > 0n && !!contractAddress;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: identityNFTAbi,
    functionName: "identities",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled },
  });

  const identity = data
    ? {
        level: Number(data[0]),
        totalXP: Number(data[1]),
        questsCompleted: Number(data[2]),
        mintedAt: Number(data[3]),
        faction: data[4],
      }
    : null;

  return { identity, isLoading, error, refetch };
}

export function useTokenURI(tokenId?: bigint) {
  const contractAddress = CONTRACTS.identityNFT as `0x${string}`;
  const enabled = tokenId !== undefined && tokenId > 0n && !!contractAddress;

  return useReadContract({
    address: contractAddress,
    abi: identityNFTAbi,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled },
  });
}

export function useMintIdentity() {
  const contractAddress = CONTRACTS.identityNFT as `0x${string}`;
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function mint() {
    writeContract({
      address: contractAddress,
      abi: identityNFTAbi,
      functionName: "mintIdentity",
    });
  }

  return { mint, hash, isPending, isConfirming, isSuccess, error };
}

export function useSetFaction() {
  const contractAddress = CONTRACTS.identityNFT as `0x${string}`;
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function setFaction(faction: string) {
    writeContract({
      address: contractAddress,
      abi: identityNFTAbi,
      functionName: "setFaction",
      args: [faction],
    });
  }

  return { setFaction, hash, isPending, isConfirming, isSuccess, error };
}

// ──────────────────────────────────────────
//  Quest Completion Check
// ──────────────────────────────────────────

export function useHasCompletedQuest(address?: `0x${string}`, questId?: number) {
  const contractAddress = CONTRACTS.playerProgress as `0x${string}`;
  const enabled = !!address && questId !== undefined && !!contractAddress;

  return useReadContract({
    address: contractAddress,
    abi: playerProgressAbi,
    functionName: "hasCompletedQuest",
    args: address && questId !== undefined ? [address, BigInt(questId)] : undefined,
    query: { enabled },
  });
}

// ──────────────────────────────────────────
//  Quest Count (on-chain)
// ──────────────────────────────────────────

export function useQuestCount() {
  const contractAddress = CONTRACTS.questRegistry as `0x${string}`;
  const enabled = !!contractAddress;

  return useReadContract({
    address: contractAddress,
    abi: questRegistryAbi,
    functionName: "questCount",
    query: { enabled },
  });
}
