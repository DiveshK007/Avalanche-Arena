'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CrossChainDashboard — Shows ICM cross-chain activity and connected game chains.
 */

interface ChainInfo {
  id: string;
  name: string;
  completionsCount: number;
  active: boolean;
  color: string;
}

interface CrossChainStats {
  totalCompletions: number;
  totalXPSynced: number;
  registeredChains: number;
  recentMessages: TeleporterMessage[];
}

interface TeleporterMessage {
  id: string;
  sourceChain: string;
  destinationChain: string;
  player: string;
  type: 'quest' | 'reputation' | 'registration';
  status: 'delivered' | 'pending' | 'failed';
  timestamp: number;
}

// Demo data for hackathon presentation
const DEMO_CHAINS: ChainInfo[] = [
  { id: '1', name: 'DeFi Kingdoms', completionsCount: 142, active: true, color: '#50c878' },
  { id: '2', name: 'Beam', completionsCount: 89, active: true, color: '#ff6b35' },
  { id: '3', name: 'Off The Grid', completionsCount: 234, active: true, color: '#9b59b6' },
  { id: '4', name: 'MapleStory Universe', completionsCount: 67, active: true, color: '#f1c40f' },
  { id: '5', name: 'Shrapnel', completionsCount: 45, active: false, color: '#e74c3c' },
];

const DEMO_MESSAGES: TeleporterMessage[] = [
  { id: '1', sourceChain: 'DeFi Kingdoms', destinationChain: 'Arena', player: '0xAb5...3F2', type: 'quest', status: 'delivered', timestamp: Date.now() - 30000 },
  { id: '2', sourceChain: 'Beam', destinationChain: 'Arena', player: '0x8C1...9E4', type: 'reputation', status: 'delivered', timestamp: Date.now() - 120000 },
  { id: '3', sourceChain: 'Off The Grid', destinationChain: 'Arena', player: '0xFf2...1A7', type: 'quest', status: 'pending', timestamp: Date.now() - 5000 },
  { id: '4', sourceChain: 'MapleStory Universe', destinationChain: 'Arena', player: '0x3D9...8B1', type: 'registration', status: 'delivered', timestamp: Date.now() - 300000 },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

const statusColors = {
  delivered: 'text-green-400',
  pending: 'text-yellow-400',
  failed: 'text-red-400',
};

const typeIcons = {
  quest: '⚔️',
  reputation: '⭐',
  registration: '🎮',
};

export default function CrossChainDashboard() {
  const [stats] = useState<CrossChainStats>({
    totalCompletions: 577,
    totalXPSynced: 48250,
    registeredChains: 5,
    recentMessages: DEMO_MESSAGES,
  });

  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [animatedCompletions, setAnimatedCompletions] = useState(0);

  useEffect(() => {
    const target = stats.totalCompletions;
    let current = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedCompletions(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [stats.totalCompletions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xl">
          🌉
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Cross-Chain Hub</h2>
          <p className="text-sm text-zinc-400">
            Powered by Avalanche ICM (Interchain Messaging)
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Cross-Chain Completions', value: animatedCompletions, icon: '⚡' },
          { label: 'XP Synced', value: stats.totalXPSynced.toLocaleString(), icon: '⭐' },
          { label: 'Connected Games', value: stats.registeredChains, icon: '🎮' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Connected Chains */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">
          Connected Game Chains
        </h3>
        <div className="space-y-3">
          {DEMO_CHAINS.map((chain, i) => (
            <motion.button
              key={chain.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedChain(selectedChain === chain.id ? null : chain.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                selectedChain === chain.id
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: chain.color }}
                />
                <span className="text-white font-medium">{chain.name}</span>
                {!chain.active && (
                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                    INACTIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 text-sm">
                  {chain.completionsCount} quests
                </span>
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: chain.color }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(chain.completionsCount / 250) * 100}%`,
                    }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Teleporter Message Feed */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            ICM Message Feed
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {stats.recentMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{typeIcons[msg.type]}</span>
                  <div>
                    <div className="text-sm text-white">
                      <span className="text-zinc-400">{msg.player}</span>
                      {' '}
                      <span className="text-zinc-500">from</span>
                      {' '}
                      <span className="font-medium">{msg.sourceChain}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {msg.type === 'quest' && 'Quest completed'}
                      {msg.type === 'reputation' && 'Reputation synced'}
                      {msg.type === 'registration' && 'Game registered'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${statusColors[msg.status]}`}>
                    {msg.status === 'delivered' && '✓ Delivered'}
                    {msg.status === 'pending' && '◌ Pending'}
                    {msg.status === 'failed' && '✗ Failed'}
                  </span>
                  <span className="text-xs text-zinc-500">{timeAgo(msg.timestamp)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Teleporter Address Info */}
      <div className="text-center text-xs text-zinc-500 space-y-1">
        <p>TeleporterMessenger: <code className="text-zinc-400">0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf</code></p>
        <p>TeleporterRegistry (Fuji): <code className="text-zinc-400">0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228</code></p>
      </div>
    </div>
  );
}
