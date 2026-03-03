import dynamic from "next/dynamic";

export const revalidate = 0;

const LeaderboardContent = dynamic(() => import("./LeaderboardContent"), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-gray-500 mb-8">Loading...</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-arena-card border border-arena-border rounded-xl h-20" />
        ))}
      </div>
    </div>
  ),
});

export default function LeaderboardPage() {
  return <LeaderboardContent />;
}
