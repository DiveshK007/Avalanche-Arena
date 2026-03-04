# Avalanche Arena — Cross-Chain Integration Architecture

## Overview

Avalanche Arena leverages Avalanche's native cross-chain technologies to create a truly
interoperable gaming reputation protocol. This document covers the architectural decisions
and integration patterns for ICM, ICTT, Chainlink, and the Avalanche Data API.

---

## 1. ICM — Interchain Messaging (Cross-Chain Quest Verification)

### Architecture

```
┌─────────────────────┐        ICM/Teleporter        ┌─────────────────────────┐
│   Game L1 Chain      │ ──────────────────────────► │   Arena Chain (Fuji)     │
│                      │                              │                          │
│ CrossChainQuestSender│   TeleporterMessenger        │ CrossChainQuestVerifier  │
│   - reportQuest()    │ → 0x253b...5fcf             │   - receiveTeleporter()  │
│   - syncReputation() │                              │   - rewardPlayer()       │
│   - registerGame()   │  ◄────────────────────────  │   - syncReputation()     │
│                      │        Receipts              │                          │
└─────────────────────┘                              └─────────────────────────┘
```

### Contracts

| Contract | Location | Purpose |
|----------|----------|---------|
| `CrossChainQuestVerifier.sol` | Arena Chain | Receives ICM messages, verifies source, rewards players |
| `CrossChainQuestSender.sol` | Game L1s | Sends quest proofs from game chains to Arena |
| `ITeleporterMessenger.sol` | Interface | Teleporter interface (deployed at 0x253b...5fcf) |
| `ITeleporterReceiver.sol` | Interface | Receiver interface for incoming messages |

### Message Types

1. **QUEST_COMPLETION** — Player completed a quest on a game chain
2. **REPUTATION_SYNC** — Sync XP/reputation from game chain to Arena
3. **GAME_REGISTRATION** — Game L1 registering itself with Arena

### Security Model

- Only `TeleporterMessenger` (0x253b...5fcf) can call `receiveTeleporterMessage`
- Source chains must be whitelisted via `approveSourceChain()`
- Sender addresses must be approved per-chain via `approveSender()`
- Replay protection via message hash tracking
- Event emission for invalid messages (auditing)

### Deployed Addresses

| Contract | Network | Address |
|----------|---------|---------|
| TeleporterMessenger | All chains | `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf` |
| TeleporterRegistry | Fuji C-Chain | `0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228` |

---

## 2. ICTT — Interchain Token Transfer (Reputation Bridging)

### Architecture

```
┌────────────────────┐     ICTT Bridge      ┌────────────────────┐
│  Arena Chain        │ ◄────────────────► │  Game L1 Chain      │
│                     │                     │                     │
│ ArenaReputationToken│    Lock/Mint         │  ERC20TokenRemote   │
│ (ART - ERC20)      │ ──────────────────► │  (wrapped ART)      │
│                     │    Burn/Unlock       │                     │
│ ERC20TokenHome      │ ◄────────────────  │                     │
└────────────────────┘                     └────────────────────┘
```

### Token: Arena Reputation Token (ART)

- **Standard**: ERC-20 + ERC20Burnable
- **Supply Cap**: 1,000,000,000 ART
- **Minting**: Only authorized minters (RewardEngine, CrossChainVerifier)
- **Burning**: Players can burn for marketplace discounts
- **Bridging**: Approved for ICTT TokenHome for cross-chain transfer

### Token Economics

| Action | ART Impact |
|--------|-----------|
| Complete quest | Mint 1 ART per 1 XP |
| Cross-chain sync | Mint ART equivalent |
| Marketplace discount | Burn ART |
| Governance voting | Weight = ART balance |

---

## 3. Chainlink Integration

### VRF V2.5 — Random Rewards

```
Player completes quest → RewardEngine → ArenaRandomRewards
                                              │
                                              ▼
                                    Chainlink VRF Coordinator
                                    (0x5C21...7BEE on Fuji)
                                              │
                                              ▼
                                    Random result callback
                                              │
                                    ┌─────────┴──────────┐
                                    │                      │
                              Bonus XP (1-5x)     Mystery Reward
```

**Reward Types:**
- `BONUS_XP_MULTIPLIER` — 40% chance 1x, 25% 1.5x, 20% 2x, 10% 3x, 5% 5x
- `MYSTERY_REWARD` — Random XP from tier list
- `DAILY_QUEST_SELECTION` — Random quest of the day
- `TOURNAMENT_SEED` — Random bracket placement

### Price Feed — Marketplace

```
ArenaPriceFeed ──► Chainlink AVAX/USD (0x5498...06aD on Fuji)
       │
       ▼
ArenaMarketplace
  - USD-denominated listings
  - Dynamic AVAX pricing
  - Overpayment refunds
```

**Features:**
- Stale price protection (max 1 hour)
- Multi-feed support
- AVAX ↔ USD conversion
- Payment sufficiency checking with overpayment calculation

---

## 4. Avalanche Data API (Glacier)

### Integration Points

| Feature | API Endpoint | Usage |
|---------|-------------|-------|
| Block tracking | `/v2/chains/{id}/blocks/latest` | Indexer sync point |
| Transaction history | `/v2/chains/{id}/addresses/{addr}/transactions` | Player activity |
| Token transfers | `/v2/chains/{id}/addresses/{addr}/erc20Transfers` | ART tracking |
| NFT ownership | `/v2/chains/{id}/addresses/{addr}/balances:listErc721` | Identity NFT |
| Contract logs | `/v2/chains/{id}/addresses/{addr}/logs` | Quest events |
| Teleporter messages | `/v2/teleporterMessages` | ICM tracking |

### Client: `apps/indexer/src/services/dataAPI.ts`

Singleton client that wraps all Glacier API calls with:
- API key authentication
- Pagination support
- Arena-specific helper methods
- Error handling and logging

---

## 5. Contract Dependency Graph

```
                    ┌──────────────────┐
                    │   QuestRegistry  │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐
    │RewardEngine │  │ProofValidator│  │CrossChainQuestVerifier│
    └──┬───┬──┬───┘  └──────────────┘  └───────────────────────┘
       │   │  │                               ▲
       ▼   ▼  ▼                               │ ICM
  ┌────┐ ┌──┐ ┌──────────┐          ┌────────┴─────────┐
  │PP  │ │ID│ │RandomRwds│          │CrossChainQuestSender│
  └────┘ └──┘ └──────────┘          └──────────────────────┘
                    │
                    ▼
            Chainlink VRF

  ┌──────────────────┐     ┌───────────────┐
  │ArenaRepToken(ART)│────►│ ICTT TokenHome│
  └──────────────────┘     └───────────────┘

  ┌──────────────────┐     ┌───────────────┐
  │ArenaPriceFeed    │────►│Chainlink Feed │
  └──────────────────┘     └───────────────┘

  ┌──────────────────┐     ┌───────────────┐
  │ArenaMarketplace  │────►│ArenaPriceFeed │
  └──────────────────┘     └───────────────┘

  ┌──────────────────┐
  │ArenaGovernance   │
  └──────────────────┘

  PP = PlayerProgress, ID = IdentityNFT
```

---

## 6. Deployment Order

1. QuestRegistry
2. PlayerProgress
3. IdentityNFT
4. RewardEngine (wire to 1, 2, 3)
5. ProofValidator (wire to 4)
6. CrossChainQuestVerifier (wire to 4, 2)
7. ArenaReputationToken (add minters: 4, 6)
8. ArenaPriceFeed (Chainlink AVAX/USD)
9. ArenaRandomRewards (Chainlink VRF) — *requires VRF subscription*
10. ArenaGovernance (wire to 2, 3)
11. ArenaMarketplace
12. CrossChainQuestSender (on each game L1)
13. MockGame (testnet only)

---

## 7. Environment Variables

See `.env` for all configuration. Key additions:

```bash
# ICM
TELEPORTER_MESSENGER_ADDRESS=0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf
TELEPORTER_REGISTRY_FUJI=0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228

# Chainlink
CHAINLINK_VRF_COORDINATOR=0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
CHAINLINK_VRF_KEY_HASH=0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887
CHAINLINK_AVAX_USD_FEED=0x5498BB86BC934c8D34FDA08E81D444153d0D06aD

# Avalanche Data API
AVALANCHE_DATA_API_URL=https://glacier-api.avax.network
```

---

## 8. Testing

- **94 total tests** across 3 test files
- `Arena.test.ts` — Core contract integration (17 tests)
- `Extended.test.ts` — Extended coverage (42 tests)
- `CrossChain.test.ts` — ICM, ICTT, Chainlink tests (35 tests)

Run all: `npx hardhat test`
Run cross-chain only: `npx hardhat test test/CrossChain.test.ts`
