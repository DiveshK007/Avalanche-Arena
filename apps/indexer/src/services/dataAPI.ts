import { logger } from "../logger";

/**
 * 🔺 Avalanche Data API (Glacier) Client
 *
 * Integrates with Avalanche's official Data API for:
 *   - On-chain transaction indexing and analytics
 *   - Token transfer tracking across L1s
 *   - NFT metadata and ownership queries
 *   - Block and log queries for quest verification
 *   - Cross-chain message tracking (ICM)
 *
 * API Docs: https://glacier-api.avax.network/api
 * Console: https://build.avax.network/console (get API key)
 */

const DATA_API_BASE = process.env.AVALANCHE_DATA_API_URL || "https://glacier-api.avax.network";
const API_KEY = process.env.AVALANCHE_DATA_API_KEY || "";

interface DataAPIOptions {
  chainId?: string;
  pageSize?: number;
  pageToken?: string;
}

interface TransactionResult {
  txHash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  blockTimestamp: number;
  status: string;
  gasUsed: string;
}

interface TokenTransfer {
  txHash: string;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  blockNumber: number;
}

interface NFTTransfer {
  txHash: string;
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  blockNumber: number;
}

interface LogEntry {
  txHash: string;
  logIndex: number;
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  blockTimestamp: number;
}

interface BlockInfo {
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  txCount: number;
  gasUsed: string;
}

class AvalancheDataAPI {
  private baseUrl: string;
  private apiKey: string;
  private defaultChainId: string;

  constructor() {
    this.baseUrl = DATA_API_BASE;
    this.apiKey = API_KEY;
    this.defaultChainId = "43113"; // Fuji testnet
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["x-glacier-api-key"] = this.apiKey;
    }

    try {
      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        throw new Error(`Data API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      logger.error(`Avalanche Data API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────
  //  Chain & Block Queries
  // ──────────────────────────────────────────────

  /**
   * Get the latest block number on a chain
   */
  async getLatestBlockNumber(chainId?: string): Promise<number> {
    const cid = chainId || this.defaultChainId;
    const result = await this.request<{ blockNumber: string }>(
      `/v2/chains/${cid}/blocks/latest`
    );
    return parseInt(result.blockNumber);
  }

  /**
   * Get block details
   */
  async getBlock(blockNumber: number, chainId?: string): Promise<BlockInfo> {
    const cid = chainId || this.defaultChainId;
    return this.request<BlockInfo>(
      `/v2/chains/${cid}/blocks/${blockNumber}`
    );
  }

  // ──────────────────────────────────────────────
  //  Transaction Queries
  // ──────────────────────────────────────────────

  /**
   * Get transactions for an address
   */
  async getAddressTransactions(
    address: string,
    options: DataAPIOptions = {}
  ): Promise<{ transactions: TransactionResult[]; nextPageToken?: string }> {
    const chainId = options.chainId || this.defaultChainId;
    return this.request(
      `/v2/chains/${chainId}/addresses/${address}/transactions`,
      {
        pageSize: String(options.pageSize || 25),
        ...(options.pageToken ? { pageToken: options.pageToken } : {}),
      }
    );
  }

  /**
   * Get a specific transaction by hash
   */
  async getTransaction(txHash: string, chainId?: string): Promise<TransactionResult> {
    const cid = chainId || this.defaultChainId;
    return this.request<TransactionResult>(
      `/v2/chains/${cid}/transactions/${txHash}`
    );
  }

  // ──────────────────────────────────────────────
  //  Token Queries (ICTT Tracking)
  // ──────────────────────────────────────────────

  /**
   * Get ERC-20 token transfers for an address
   * Useful for tracking ART (Arena Reputation Token) across chains
   */
  async getTokenTransfers(
    address: string,
    options: DataAPIOptions = {}
  ): Promise<{ transfers: TokenTransfer[]; nextPageToken?: string }> {
    const chainId = options.chainId || this.defaultChainId;
    return this.request(
      `/v2/chains/${chainId}/addresses/${address}/erc20Transfers`,
      {
        pageSize: String(options.pageSize || 50),
        ...(options.pageToken ? { pageToken: options.pageToken } : {}),
      }
    );
  }

  /**
   * Get ERC-20 token balances for an address
   */
  async getTokenBalances(
    address: string,
    chainId?: string
  ): Promise<{ erc20TokenBalances: Array<{ balance: string; tokenAddress: string; tokenName: string; tokenSymbol: string }> }> {
    const cid = chainId || this.defaultChainId;
    return this.request(
      `/v2/chains/${cid}/addresses/${address}/balances:listErc20`
    );
  }

  // ──────────────────────────────────────────────
  //  NFT Queries (Identity NFT Tracking)
  // ──────────────────────────────────────────────

  /**
   * Get NFT transfers for an address
   */
  async getNFTTransfers(
    address: string,
    options: DataAPIOptions = {}
  ): Promise<{ transfers: NFTTransfer[]; nextPageToken?: string }> {
    const chainId = options.chainId || this.defaultChainId;
    return this.request(
      `/v2/chains/${chainId}/addresses/${address}/erc721Transfers`,
      {
        pageSize: String(options.pageSize || 50),
        ...(options.pageToken ? { pageToken: options.pageToken } : {}),
      }
    );
  }

  /**
   * Get NFTs owned by an address
   */
  async getNFTsOwned(
    address: string,
    chainId?: string
  ): Promise<{ erc721TokenBalances: Array<{ tokenId: string; contractAddress: string; name: string }> }> {
    const cid = chainId || this.defaultChainId;
    return this.request(
      `/v2/chains/${cid}/addresses/${address}/balances:listErc721`
    );
  }

  // ──────────────────────────────────────────────
  //  Log Queries (Quest Event Tracking)
  // ──────────────────────────────────────────────

  /**
   * Get logs for a contract (event monitoring for quests)
   * This is the key function for quest verification — gets game events
   */
  async getContractLogs(
    contractAddress: string,
    options: DataAPIOptions & {
      fromBlock?: number;
      toBlock?: number;
      topic0?: string; // Event signature hash
    } = {}
  ): Promise<{ logs: LogEntry[]; nextPageToken?: string }> {
    const chainId = options.chainId || this.defaultChainId;
    const params: Record<string, string> = {
      pageSize: String(options.pageSize || 100),
    };

    if (options.fromBlock) params.startBlock = String(options.fromBlock);
    if (options.toBlock) params.endBlock = String(options.toBlock);
    if (options.topic0) params.topic0 = options.topic0;
    if (options.pageToken) params.pageToken = options.pageToken;

    return this.request(
      `/v2/chains/${chainId}/addresses/${contractAddress}/logs`,
      params
    );
  }

  // ──────────────────────────────────────────────
  //  Cross-Chain / ICM Tracking
  // ──────────────────────────────────────────────

  /**
   * Get Teleporter messages for cross-chain quest verification
   */
  async getTeleporterMessages(
    options: DataAPIOptions & {
      sourceChainId?: string;
      destinationChainId?: string;
    } = {}
  ): Promise<{ messages: Array<{
    messageId: string;
    sourceBlockchainId: string;
    destinationBlockchainId: string;
    sourceAddress: string;
    destinationAddress: string;
    status: string;
    timestamp: number;
  }>; nextPageToken?: string }> {
    const params: Record<string, string> = {
      pageSize: String(options.pageSize || 25),
    };
    if (options.sourceChainId) params.sourceChainId = options.sourceChainId;
    if (options.destinationChainId) params.destinationChainId = options.destinationChainId;
    if (options.pageToken) params.pageToken = options.pageToken;

    return this.request("/v2/teleporterMessages", params);
  }

  // ──────────────────────────────────────────────
  //  Arena-Specific Helpers
  // ──────────────────────────────────────────────

  /**
   * Get all quest completion events for a player
   */
  async getPlayerQuestEvents(
    questRegistryAddress: string,
    playerAddress: string,
    chainId?: string
  ): Promise<LogEntry[]> {
    const cid = chainId || this.defaultChainId;
    // QuestCompleted(address indexed player, uint256 indexed questId)
    const topic0 = "0x" + "9c" + "0".repeat(62); // placeholder; actual topic computed from event sig
    const paddedAddress = "0x000000000000000000000000" + playerAddress.slice(2).toLowerCase();

    try {
      const result = await this.request<{ logs: LogEntry[] }>(
        `/v2/chains/${cid}/addresses/${questRegistryAddress}/logs`,
        {
          topic1: paddedAddress,
          pageSize: "100",
        }
      );
      return result.logs || [];
    } catch {
      return [];
    }
  }

  /**
   * Get leaderboard data — top players by transaction count with Arena contracts
   */
  async getArenaLeaderboardData(
    contracts: string[],
    chainId?: string
  ): Promise<Map<string, number>> {
    const cid = chainId || this.defaultChainId;
    const playerCounts = new Map<string, number>();

    for (const contract of contracts) {
      try {
        const result = await this.getContractLogs(contract, {
          chainId: cid,
          pageSize: 500,
        });

        for (const log of result.logs || []) {
          // Extract player address from topics[1] if present
          if (log.topics.length > 1) {
            const player = "0x" + log.topics[1].slice(26);
            playerCounts.set(player, (playerCounts.get(player) || 0) + 1);
          }
        }
      } catch (err) {
        logger.warn(`Failed to get logs for ${contract}: ${err}`);
      }
    }

    return playerCounts;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request("/v2/chains");
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const dataAPI = new AvalancheDataAPI();
export default dataAPI;
