# 🔺 Avalanche Arena

**Cross-Game Progression & Reputation Protocol for Avalanche**

> Avalanche Arena is a cross-game quest and identity layer that turns on-chain activity into progression — where your wallet becomes a character that levels up across the entire Avalanche ecosystem.

[![CI](https://github.com/DiveshK007/Avalanche-Arena/actions/workflows/ci.yml/badge.svg)](https://github.com/DiveshK007/Avalanche-Arena/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Avalanche](https://img.shields.io/badge/Avalanche-Fuji%20Testnet-red)](https://testnet.snowtrace.io)

---

## 🧊 What Is This?

Avalanche Arena transforms fragmented on-chain gaming activity into a unified, evolving player identity. Instead of each game having siloed progression, Arena creates a **shared reputation layer** across the entire Avalanche ecosystem.

**Your wallet becomes your character.**

- 🎮 Play games → earn XP
- ✅ Complete quests → unlock badges
- 🎭 Mint identity NFT → watch it evolve
- 🏆 Climb the leaderboard → build reputation
- 🏛️ Vote on governance proposals → shape the protocol
- 🛒 Trade game NFTs → marketplace with royalties
- 📊 Track analytics → global protocol stats

---

## 🏗️ Architecture

```
Partner Games (Smart Contracts)
        │ Events
        ▼
Proof Indexer Layer (Verifier Engine)
  ├── WebSocket event listener
  ├── Quest matcher
  ├── Proof generator + EIP-191 signing
  └── Retry queue (exponential backoff)
        │ Attestations
        ▼
Avalanche Arena Smart Contracts
├── QuestRegistry       — Quest definitions
├── PlayerProgress      — XP, levels, streaks
├── ProofValidator      — Signature verification
├── RewardEngine        — Orchestration layer
├── IdentityNFT         — Dynamic soulbound NFT
├── ArenaGovernance     — On-chain governance
└── ArenaMarketplace    — NFT marketplace
        │
        ▼
┌─────────────────────────────────────────┐
│  Express API + WebSocket Server         │
│  ├── SIWE Authentication (Sign-In)      │
│  ├── JWT Sessions                        │
│  ├── Redis Caching (ioredis)            │
│  ├── Rate Limiting                       │
│  ├── Zod Env Validation                 │
│  └── Real-time WS Events               │
├─────────────────────────────────────────┤
│  Next.js 14 Frontend                     │
│  ├── RainbowKit + wagmi v2              │
│  ├── Dark/Light Theme                    │
│  ├── Toast Notifications (sonner)       │
│  ├── Error Boundaries                    │
│  ├── Live Activity Feed (WebSocket)     │
│  └── Framer Motion Animations           │
├─────────────────────────────────────────┤
│  PostgreSQL 16  │  Redis 7  │  Docker   │
└─────────────────────────────────────────┘
```

**Design Principle:** Off-chain compute, on-chain settlement.

---

## 📁 Project Structure

```
avalanche-arena/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   ├── api/                    # Express API + WebSocket server
│   └── indexer/                # Proof engine + event listener
├── contracts/                  # Smart contracts (Hardhat)
│   ├── src/
│   │   ├── QuestRegistry.sol
│   │   ├── PlayerProgress.sol
│   │   ├── ProofValidator.sol
│   │   ├── RewardEngine.sol
│   │   ├── IdentityNFT.sol
│   │   ├── ArenaGovernance.sol
│   │   ├── ArenaMarketplace.sol
│   │   └── mocks/MockGame.sol
│   ├── test/                   # 59 tests (unit + extended)
│   └── scripts/                # Deploy + verify scripts
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── config/                 # Shared config, ABIs & IPFS utils
│   └── sdk/                    # Multi-Game SDK (@arena/sdk)
├── docs/
│   └── ARCHITECTURE.md         # Subgraph, Subnet, Cross-Chain docs
├── docker/                     # PostgreSQL + Redis (docker-compose)
├── .github/workflows/ci.yml   # CI/CD pipeline (5 jobs)
├── turbo.json                  # Turborepo pipeline config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/DiveshK007/Avalanche-Arena.git
cd Avalanche-Arena
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your keys:
#   DEPLOYER_PRIVATE_KEY, RPC_URL, WALLETCONNECT_PROJECT_ID,
#   JWT_SECRET, DATABASE_URL, REDIS_URL, PINATA_JWT (optional)
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL + Redis
cd docker && docker-compose up -d

# Run database migrations
pnpm --filter @arena/api migrate
```

### 4. Compile & Deploy Contracts

```bash
# Compile all contracts
pnpm --filter @arena/contracts compile

# Option A: Deploy to local Hardhat node
pnpm --filter @arena/contracts node   # Terminal 1
pnpm deploy:local                      # Terminal 2

# Option B: Deploy to Fuji testnet
pnpm deploy:fuji

# Verify on Snowtrace (after Fuji deploy)
pnpm verify:fuji
```

### 5. Start All Services (Turborepo)

```bash
# Start everything in parallel
pnpm dev

# Or start individually:
pnpm dev:api       # Express API + WebSocket on :4000
pnpm dev:indexer   # Event indexer + proof engine
pnpm dev:web       # Next.js on :3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 Smart Contracts

| Contract | Purpose |
|---|---|
| `QuestRegistry` | Stores quest definitions from partner games |
| `PlayerProgress` | Tracks XP, level, streaks, quest completions |
| `ProofValidator` | Verifies signed attestations from indexer |
| `RewardEngine` | Orchestrates XP, badges, NFT evolution |
| `IdentityNFT` | Dynamic ERC-721 that evolves with progression |
| `ArenaGovernance` | On-chain governance (proposals, voting, execution) |
| `ArenaMarketplace` | NFT marketplace with royalties & arena fees |

### Contract Interaction Flow

```
Game Event → Indexer → ProofValidator → RewardEngine → PlayerProgress + IdentityNFT
```

### Governance

- Players with Level 3+ can create proposals
- Voting weight = player level (Level 1+ required)
- 3-day voting period, quorum of 10 votes
- Owner executes passed proposals on-chain

### Marketplace

- Approved game collections only
- 2.5% arena fee + configurable royalties (up to 10%)
- List, buy, and delist game NFTs

### Run Tests

```bash
pnpm test:contracts    # 59 tests (unit + extended coverage)
```

---

## 🔄 How The Proof System Works

1. Player performs action in a partner game (e.g., wins a match)
2. Game contract emits an event
3. Arena's indexer detects the event via WebSocket
4. Indexer matches event to a registered quest
5. Generates attestation payload
6. Signs with EIP-191 (trusted signer)
7. Submits proof to `ProofValidator` contract
8. Contract verifies signature + conditions
9. `RewardEngine` awards XP and evolves identity

**Security layers:**
- Dual replay protection (DB + on-chain)
- Cooldown enforcement
- Trusted signer verification
- Proof expiry window (batch + single proof validation)

---

## 🎭 Identity NFT

Each wallet can mint **one** dynamic Identity NFT that:

- Evolves visually based on XP milestones
- Reflects cross-game achievements
- Displays tier (Novice → Mythic)
- Shows faction alignment
- Is **soulbound** by default (non-transferable, toggleable by owner)
- Uses **on-chain SVG** rendering (fully decentralized metadata)
- Supports IPFS metadata via Pinata (`@arena/config` IPFS utilities)

### Tier System

| Tier | Level Range | Color |
|---|---|---|
| Novice | 0-2 | 🔵 Blue |
| Adventurer | 3-5 | 🟢 Green |
| Warrior | 6-9 | 🟠 Orange |
| Champion | 10-14 | 🟣 Purple |
| Legend | 15-24 | 🟡 Gold |
| Mythic | 25+ | 🔴 Red |

---

## 🌐 Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page with hero, features, and how-it-works |
| `/dashboard` | Player stats, identity card, quest progress, activity feed |
| `/quests` | Quest discovery with filters, click-to-play modal |
| `/leaderboard` | Global rankings with pagination |
| `/identity` | NFT viewer, faction selection, tier info |
| `/achievements` | Achievement badges and unlock progress |
| `/profile/[address]` | Player profile with transaction history |
| `/analytics` | Global protocol analytics dashboard |

### Frontend Features

- **🌗 Dark/Light Theme** — Toggle with `next-themes`, persisted
- **🔔 Toast Notifications** — Transaction feedback via `sonner`
- **⚡ Live Activity Feed** — Real-time WebSocket events
- **🛡️ Error Boundaries** — Graceful error handling with retry
- **🎨 Animations** — Smooth transitions via `framer-motion`
- **📱 Responsive** — Mobile-first with Tailwind CSS
- **🔐 Wallet Auth** — RainbowKit + wagmi v2 + SIWE

---

## 🔌 Multi-Game SDK

The `@arena/sdk` package lets game developers integrate with Arena in minutes:

```typescript
import { ArenaSDK } from '@arena/sdk';

const arena = new ArenaSDK({
  apiUrl: 'https://api.arena.avax.network',
  gameId: 'my-game',
  apiKey: 'gk_...',
});

// Get player stats
const stats = await arena.getPlayerStats('0x...');

// Check quest completion
const done = await arena.hasCompleted('0x...', 1);

// Report a game event
await arena.reportEvent({
  eventType: 'match_won',
  player: '0x...',
  data: { score: 1500 },
});

// Get leaderboard
const top = await arena.getLeaderboard(1, 10);
```

---

## 🧪 Testing

### Smart Contract Tests (59 passing)

```bash
pnpm test:contracts
```

Covers: QuestRegistry, PlayerProgress, ProofValidator, RewardEngine, IdentityNFT, MockGame — including edge cases, access control, event emissions, multi-player scenarios, batch proofs, and streak tracking.

### E2E Tests (Playwright)

```bash
cd apps/web
pnpm test:e2e        # Headless
pnpm test:e2e:ui     # Interactive UI mode
```

Covers: Home page rendering, navigation, wallet connect button, theme toggle, quest filters, leaderboard, achievements, mobile responsive.

### Type Checking

```bash
pnpm typecheck       # All packages via Turborepo
```

### Linting

```bash
pnpm lint            # All packages via Turborepo
```

---

## 🔺 Deployment

### Fuji Testnet

```bash
pnpm deploy:fuji
pnpm verify:fuji     # Verify on Snowtrace
```

### Avalanche Mainnet

```bash
pnpm deploy:mainnet
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs 5 jobs on every push/PR:

1. **contracts** — Compile + run 59 Hardhat tests
2. **api** — Type-check Express API
3. **web** — Build Next.js frontend
4. **indexer** — Type-check indexer
5. **packages** — Type-check shared packages (types, config, sdk)

---

## 🛡️ Security Considerations

- **Event spoofing** → Only whitelisted contracts monitored
- **Replay attacks** → Dual-layer protection (DB + on-chain mapping)
- **Sybil farming** → Cooldowns + diminishing returns
- **Signer compromise** → Rotatable trusted signer
- **Front-running** → Proof expiry window
- **API abuse** → Rate limiting (express-rate-limit)
- **Session hijacking** → JWT + SIWE authentication
- **Env leaks** → Zod validation on startup
- **Cache poisoning** → Redis TTL + namespace isolation

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅
- Core contracts (QuestRegistry, PlayerProgress, ProofValidator, RewardEngine, IdentityNFT)
- Quest UI with click-to-play flow
- Identity NFTs with on-chain SVG
- Proof indexer with retry queue
- Express API with SIWE auth, Redis caching, rate limiting
- Next.js frontend with dark mode, toasts, error boundaries
- 59 contract tests + Playwright E2E tests
- CI/CD pipeline + Turborepo
- Docker Compose (PostgreSQL + Redis)

### Phase 2 — Expansion (In Progress)
- ArenaGovernance contract (proposals + voting)
- ArenaMarketplace contract (NFT trading + royalties)
- Multi-Game SDK (`@arena/sdk`)
- IPFS metadata utilities (Pinata integration)
- WebSocket real-time activity feed
- Analytics dashboard
- Achievement system

### Phase 3 — Protocolization (Planned)
- Subgraph indexing (see [Architecture Docs](docs/ARCHITECTURE.md))
- Dedicated Avalanche Subnet (ArenaVM)
- Cross-chain bridge (LayerZero / Avalanche Warp Messaging)
- Publisher dashboards
- Token economics

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture plans for Subgraph, Subnet, and Cross-Chain features.

---

## 🧠 Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin 5.x |
| Indexer | Node.js, ethers.js v6, PostgreSQL, retry queue |
| API | Express.js, SIWE, JWT, Redis (ioredis), WebSocket (ws), Zod |
| Frontend | Next.js 14, Tailwind CSS, wagmi v2, viem v2, RainbowKit v2, framer-motion |
| SDK | `@arena/sdk` — TypeScript, viem |
| Database | PostgreSQL 16, Redis 7 |
| Testing | Hardhat (59 tests), Playwright (E2E) |
| Build | pnpm workspaces, Turborepo |
| CI/CD | GitHub Actions (5-job pipeline) |
| Infra | Docker Compose |

---

## 📄 License

MIT

---

**Built for the Avalanche ecosystem. 🔺**
