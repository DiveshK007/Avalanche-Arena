'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * ReputationTokenCard — Shows ART (Arena Reputation Token) balance with ICTT bridge status.
 */

interface ReputationData {
  balance: string;
  lifetimeReputation: string;
  bridgedAmount: string;
  chains: { name: string; balance: string; color: string }[];
}

// Demo data
const DEMO_DATA: ReputationData = {
  balance: '2,450',
  lifetimeReputation: '3,200',
  bridgedAmount: '750',
  chains: [
    { name: 'Arena (Home)', balance: '2,450', color: '#e74c3c' },
    { name: 'DeFi Kingdoms', balance: '420', color: '#50c878' },
    { name: 'Beam', balance: '210', color: '#ff6b35' },
    { name: 'Off The Grid', balance: '120', color: '#9b59b6' },
  ],
};

export default function ReputationTokenCard() {
  const [data] = useState<ReputationData>(DEMO_DATA);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const totalNumeric = 3200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 p-5 backdrop-blur-sm relative overflow-hidden"
    >
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-white text-sm">
            ART
          </div>
          <div>
            <h3 className="text-white font-bold">Arena Reputation Token</h3>
            <p className="text-xs text-zinc-400">ERC-20 • ICTT Bridgeable</p>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1 rounded-lg border border-white/10 hover:border-white/20"
        >
          {showBreakdown ? 'Hide' : 'Details'}
        </button>
      </div>

      {/* Main Balance */}
      <div className="relative z-10 mb-4">
        <div className="text-4xl font-bold text-white mb-1">{data.balance} ART</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-400">
            Lifetime: <span className="text-zinc-300">{data.lifetimeReputation}</span>
          </span>
          <span className="text-zinc-400">
            Bridged: <span className="text-orange-400">{data.bridgedAmount}</span>
          </span>
        </div>
      </div>

      {/* Distribution Bar */}
      <div className="relative z-10 mb-2">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
          {data.chains.map((chain, i) => {
            const balance = parseInt(chain.balance.replace(/,/g, ''));
            const width = (balance / totalNumeric) * 100;
            return (
              <motion.div
                key={chain.name}
                className="h-full"
                style={{ backgroundColor: chain.color }}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ delay: i * 0.15 + 0.3, duration: 0.6 }}
              />
            );
          })}
        </div>
      </div>

      {/* Chain Legend */}
      <div className="relative z-10 flex flex-wrap gap-3 text-xs">
        {data.chains.map((chain) => (
          <div key={chain.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: chain.color }}
            />
            <span className="text-zinc-400">{chain.name}</span>
          </div>
        ))}
      </div>

      {/* Expanded Breakdown */}
      {showBreakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="relative z-10 mt-4 pt-4 border-t border-white/10 space-y-3"
        >
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Cross-Chain Distribution
          </h4>
          {data.chains.map((chain, i) => (
            <div key={chain.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: chain.color }}
                />
                <span className="text-sm text-white">{chain.name}</span>
              </div>
              <span className="text-sm text-zinc-300 font-mono">{chain.balance} ART</span>
            </div>
          ))}

          {/* Bridge Action */}
          <div className="pt-3 flex gap-2">
            <button className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Bridge ART →
            </button>
            <button className="px-4 py-2 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-colors">
              Burn
            </button>
          </div>

          {/* Token Info */}
          <div className="text-xs text-zinc-500 space-y-1 pt-2">
            <p>Contract: Uses ICTT ERC20TokenHome for cross-chain bridging</p>
            <p>Max Supply: 1,000,000,000 ART</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
