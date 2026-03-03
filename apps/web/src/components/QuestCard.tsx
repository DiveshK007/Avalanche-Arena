"use client";

import { useState, useRef } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const diffColor = getDifficultyColor(quest.difficulty);
  const diffLabel = getDifficultyLabel(quest.difficulty);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <>
      <motion.div
        ref={ref}
        onClick={() => setShowDetail(true)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -6, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden group
          ${quest.completed
            ? "bg-arena-card/50 border-arena-green/30"
            : "bg-arena-card border-arena-border hover:border-arena-accent/40 hover:shadow-xl hover:shadow-arena-accent/5"
          }
        `}
      >
        {/* Mouse-following spotlight */}
        {isHovered && !quest.completed && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232,65,66,0.06), transparent 60%)`,
            }}
          />
        )}

        {/* Top accent line */}
        {!quest.completed && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-arena-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Completed badge */}
        {quest.completed && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500/15 text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-500/20">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completed
          </div>
        )}

        {/* Game tag */}
        {quest.gameName && (
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
            {quest.gameName}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-arena-accent/90 transition-colors pr-20">
          {quest.title || `Quest #${quest.id}`}
        </h3>

        {/* Description */}
        {quest.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
            {quest.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* XP */}
            <div className="flex items-center gap-1.5 bg-arena-gold/10 px-2.5 py-1 rounded-lg">
              <span className="text-arena-gold">⚡</span>
              <span className="text-arena-gold font-bold text-xs">{quest.xpReward} XP</span>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: i < quest.difficulty ? diffColor : "#1e1e2e",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: diffColor }}>{diffLabel}</span>
            </div>
          </div>

          {!quest.completed && (
            <motion.span
              className="text-xs text-gray-600 group-hover:text-arena-accent transition-colors flex items-center gap-1"
              initial={false}
              animate={isHovered ? { x: 3 } : { x: 0 }}
            >
              Play
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.span>
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
