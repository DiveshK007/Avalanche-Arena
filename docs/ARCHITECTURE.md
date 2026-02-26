# Avalanche Arena — Architecture Documentation

## 1. Subgraph / The Graph (Improvement #17)

### Overview
A subgraph would replace the custom indexer for read-heavy queries, providing:
- Automatic indexing of all contract events
- GraphQL API for flexible queries
- Decentralized infrastructure (hosted or self-hosted)

### Subgraph Schema (proposed)

```graphql
type Player @entity {
  id: Bytes!  # wallet address
  totalXP: BigInt!
  level: BigInt!
  questsCompleted: BigInt!
  streak: BigInt!
  identity: Identity
  completions: [QuestCompletion!]! @derivedFrom(field: "player")
}

type Quest @entity {
  id: ID!
  targetContract: Bytes!
  eventSig: Bytes!
  xpReward: BigInt!
  difficulty: Int!
  cooldown: BigInt!
  active: Boolean!
  completions: [QuestCompletion!]! @derivedFrom(field: "quest")
}

type QuestCompletion @entity {
  id: ID!
  player: Player!
  quest: Quest!
  txHash: Bytes!
  timestamp: BigInt!
  blockNumber: BigInt!
}

type Identity @entity {
  id: ID!
  owner: Player!
  level: BigInt!
  totalXP: BigInt!
  questsCompleted: BigInt!
  faction: String!
  mintedAt: BigInt!
}
```

### Migration Path
1. Deploy subgraph to The Graph Studio
2. Update frontend `api.ts` to query subgraph for read operations
3. Keep custom API for write operations (auth, achievements, transactions)
4. Deprecate custom indexer's read endpoints

---

## 2. Avalanche Subnet (Improvement #26)

### Overview
An Arena-specific Avalanche Subnet would provide:
- **Custom gas token**: ARENA token for gas fees
- **Higher throughput**: Dedicated block space for game events
- **Custom VM**: Optimized for gaming workloads
- **Lower latency**: Sub-second finality

### Architecture

```
┌─────────────────────────────────────────────┐
│              Avalanche C-Chain              │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Identity  │ │ Reward   │ │ Governance │ │
│  │ NFT      │ │ Engine   │ │            │ │
│  └──────────┘ └──────────┘ └────────────┘ │
└─────────────────────┬───────────────────────┘
                      │ AWM (Avalanche Warp Messaging)
┌─────────────────────┴───────────────────────┐
│              Arena Subnet                    │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Quest    │ │ Player   │ │ Proof      │ │
│  │ Registry │ │ Progress │ │ Validator  │ │
│  └──────────┘ └──────────┘ └────────────┘ │
│                                             │
│  Custom VM: ArenaVM                         │
│  Gas Token: ARENA                           │
│  Block Time: 250ms                          │
│  Validators: Game partners                  │
└─────────────────────────────────────────────┘
```

### Benefits
- Game events processed on dedicated chain → no congestion
- Identity NFTs on C-Chain for composability with DeFi
- AWM for cross-chain proof verification
- Game partners run validators → decentralized governance

### Implementation Steps
1. Define Subnet configuration (validators, staking requirements)
2. Deploy ArenaVM with gaming-optimized precompiles
3. Set up AWM relayer between C-Chain and Subnet
4. Migrate high-throughput contracts (QuestRegistry, PlayerProgress) to Subnet
5. Keep IdentityNFT and Marketplace on C-Chain for ecosystem composability

---

## 3. Cross-Chain Bridge (Improvement #27)

### Overview
Enable Arena progression to span multiple chains via:
- **Avalanche Warp Messaging (AWM)**: Native cross-Subnet communication
- **Teleporter**: Higher-level cross-chain messaging protocol
- **LayerZero / Axelar**: For external chain bridges (Ethereum, Polygon, etc.)

### Cross-Chain Identity Flow

```
Player on Ethereum          Player on Avalanche
       │                           │
       ▼                           ▼
  Game Action ──────────────► Quest Completion
       │                           │
       ▼                           ▼
  Bridge Message ◄─────────── Proof Generated
  (LayerZero)                      │
       │                           ▼
       ▼                      XP Awarded
  XP Synced ◄──────────────── on C-Chain
  on Source Chain                   │
                                   ▼
                          Identity NFT Evolved
```

### Proposed Contract: CrossChainBridge.sol

```solidity
contract CrossChainBridge {
    // Receive verified game events from other chains
    function receiveGameEvent(
        uint16 sourceChain,
        address player,
        uint256 questId,
        bytes32 txHash,
        bytes calldata proof
    ) external onlyRelayer {
        // Verify cross-chain proof
        // Forward to ProofValidator
    }

    // Send identity updates to other chains
    function syncIdentity(
        uint16 destChain,
        address player
    ) external {
        // Package current player stats
        // Send via bridge protocol
    }
}
```

### Supported Chains (Roadmap)
| Chain | Protocol | Status |
|-------|----------|--------|
| Avalanche Subnets | AWM/Teleporter | Phase 1 |
| Ethereum | LayerZero | Phase 2 |
| Polygon | LayerZero | Phase 2 |
| Arbitrum | LayerZero | Phase 3 |
| Base | LayerZero | Phase 3 |

### Implementation Steps
1. Deploy Teleporter contracts for Avalanche Subnet ↔ C-Chain
2. Create CrossChainBridge contract with message verification
3. Integrate LayerZero for external chain support
4. Build relayer service to monitor and forward messages
5. Update frontend to show cross-chain progression

---

## Development Priorities

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Subgraph | Medium | High |
| 2 | Subnet | High | Very High |
| 3 | Cross-Chain | Very High | Transformative |

Start with Subgraph to improve read performance, then Subnet for dedicated gaming infrastructure, then Cross-Chain to expand the ecosystem.
