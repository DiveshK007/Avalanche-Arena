/**
 * Avalanche Arena — IPFS Metadata Helper
 *
 * Utilities for building and uploading NFT metadata to IPFS.
 * Supports both Pinata and direct IPFS gateway uploads.
 *
 * Usage:
 *   import { buildMetadata, uploadToIPFS } from '@arena/config/ipfs';
 *
 * For production, configure PINATA_JWT in environment.
 */

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: "number" | "boost_number" | "boost_percentage" | "date";
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: NFTAttribute[];
}

/**
 * Build standard Arena identity metadata
 */
export function buildIdentityMetadata(params: {
  tokenId: number;
  level: number;
  totalXP: number;
  questsCompleted: number;
  faction: string;
  tier: string;
  imageUri: string;
}): NFTMetadata {
  return {
    name: `Arena Identity #${params.tokenId}`,
    description: `Avalanche Arena cross-game identity. ${params.tier} tier player with ${params.totalXP} XP across ${params.questsCompleted} quests.`,
    image: params.imageUri,
    external_url: `https://arena.avax.network/profile/${params.tokenId}`,
    attributes: [
      { trait_type: "Level", value: params.level, display_type: "number" },
      { trait_type: "Total XP", value: params.totalXP, display_type: "number" },
      { trait_type: "Quests Completed", value: params.questsCompleted, display_type: "number" },
      { trait_type: "Tier", value: params.tier },
      { trait_type: "Faction", value: params.faction },
    ],
  };
}

/**
 * Build quest badge metadata
 */
export function buildBadgeMetadata(params: {
  questId: number;
  questTitle: string;
  difficulty: number;
  gameName: string;
  imageUri: string;
  completedAt: number;
}): NFTMetadata {
  return {
    name: `Arena Badge: ${params.questTitle}`,
    description: `Proof of completion for "${params.questTitle}" in ${params.gameName}. Verified on Avalanche.`,
    image: params.imageUri,
    attributes: [
      { trait_type: "Quest ID", value: params.questId, display_type: "number" },
      { trait_type: "Game", value: params.gameName },
      { trait_type: "Difficulty", value: params.difficulty, display_type: "number" },
      { trait_type: "Completed At", value: params.completedAt, display_type: "date" },
    ],
  };
}

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadToIPFS(
  metadata: NFTMetadata,
  pinataJwt: string
): Promise<string> {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: metadata.name },
    }),
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Upload image file to IPFS via Pinata
 */
export async function uploadImageToIPFS(
  imageBuffer: ArrayBuffer | Uint8Array,
  filename: string,
  pinataJwt: string
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer as ArrayBuffer)]);
  formData.append("file", blob, filename);
  formData.append("pinataMetadata", JSON.stringify({ name: filename }));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Convert IPFS URI to gateway URL for display
 */
export function ipfsToHTTP(uri: string, gateway = "https://ipfs.io"): string {
  if (uri.startsWith("ipfs://")) {
    return `${gateway}/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

/**
 * Validate that metadata follows ERC-721 Metadata standard
 */
export function validateMetadata(metadata: unknown): metadata is NFTMetadata {
  if (!metadata || typeof metadata !== "object") return false;
  const m = metadata as Record<string, unknown>;
  return (
    typeof m.name === "string" &&
    typeof m.description === "string" &&
    typeof m.image === "string" &&
    Array.isArray(m.attributes)
  );
}
