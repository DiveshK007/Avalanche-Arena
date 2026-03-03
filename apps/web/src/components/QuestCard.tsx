"use client";

import { useState } from "react";
import { getDifficultyLabel, getDifficultyColor } from "@/lib/utils";
import { QuestDetailModal } from "./QuestDetailModal";
import { motion } from "framer-motion";

interface QuestCardProps {
  quest: {
    id: number;
    title?: string;
    description?: string;
    xpReward: number;
    difficulty: number;
    gameName?: string;
    targetContract?: string;
    eventSig?: string;
    cooldown?: number;
    completed?: boolean;
  };
}

export function QuestCard({ quest }: QuestCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const diffColor = getDifficultyColor(quest.difficulty);
  const diffLabel = getDifficultyLabel(quest.difficulty);

  return (
    <>
      <motion.div
        onClick={() => setShowDetail(true)}
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative p-5 rounded-xl border transition-all duration-300 cursor-pointer
          ${quest.completed
            ? "bg-arena-card/50 border-arena-green/30"
            : "bg-arena-card border-arena-border hover:border-arena-accent/50 hover:shadow-lg"
          }
        `}
      >
        {/* Completed badge */}
        {quest.completed && (
          <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
            ✓ Completed
          </div>
        )}

        {/* Game tag */}
        {quest.gameName && (
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
            {quest.gameName}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">
          {quest.title || `Quest #${quest.id}`}
        </h3>

        {/* Description */}
        {quest.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
            {quest.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-arena-gold">⚡</span>
              <span className="text-white font-medium">{quest.xpReward} XP</span>
            </div>

            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: diffColor }}
              />
              <span style={{ color: diffColor }}>{diffLabel}</span>
            </div>
          </div>

          {!quest.completed && (
            <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
              Click to play →
            </span>
          )}
        </div>
      </motion.div>

      {/* Detail Modal */}
      {showDetail && (
        <QuestDetailModal quest={quest} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
