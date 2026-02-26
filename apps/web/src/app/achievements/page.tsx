"use client";

import dynamic from "next/dynamic";

const AchievementsContent = dynamic(() => import("./AchievementsContent"), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
      <p className="text-gray-500 mb-8">Loading...</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-arena-card rounded-xl h-32 border border-arena-border" />
        ))}
      </div>
    </div>
  ),
});

export default function AchievementsPage() {
  return <AchievementsContent />;
}
