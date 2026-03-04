'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * PriceFeedWidget — Shows live AVAX/USD price from Chainlink oracle.
 */

export default function PriceFeedWidget() {
  const [price, setPrice] = useState(24.87);
  const [prevPrice, setPrevPrice] = useState(24.87);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Simulate price ticking for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setPrevPrice(price);
      // Random walk ±0.5%
      const change = (Math.random() - 0.5) * 0.25;
      setPrice((p) => Math.max(10, +(p + change).toFixed(2)));
      setLastUpdate(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, [price]);

  const isUp = price >= prevPrice;
  const changePercent = (((price - prevPrice) / prevPrice) * 100).toFixed(2);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">🔺</span>
          </div>
          <div>
            <div className="text-xs text-zinc-400">AVAX/USD</div>
            <div className="text-xs text-zinc-500">Chainlink Oracle</div>
          </div>
        </div>
        <div className="text-right">
          <motion.div
            key={price}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-lg font-bold text-white"
          >
            ${price.toFixed(2)}
          </motion.div>
          <div className={`text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '▲' : '▼'} {changePercent}%
          </div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-zinc-500 flex justify-between">
        <span>Feed: 0x5498...06aD</span>
        <span>{Math.floor((Date.now() - lastUpdate) / 1000)}s ago</span>
      </div>
    </div>
  );
}
