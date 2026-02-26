export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-arena-accent/5 via-transparent to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-arena-accent text-sm font-medium uppercase tracking-widest mb-4">
            Cross-Game Progression Protocol
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Wallet Is Your{" "}
            <span className="text-arena-accent">Character</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Avalanche Arena turns on-chain activity into progression — level up
            across every game in the Avalanche ecosystem.
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/dashboard"
              className="bg-arena-accent text-white px-8 py-3 rounded-lg font-medium hover:bg-arena-accent/80 transition-all hover:shadow-lg hover:shadow-arena-accent/20"
            >
              Enter Arena
            </a>
            <a
              href="/quests"
              className="border border-arena-border text-white px-8 py-3 rounded-lg font-medium hover:bg-arena-card transition-all"
            >
              Browse Quests
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Play games, earn XP, evolve your identity — all tracked on-chain.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: "🎮",
                title: "Play Games",
                desc: "Complete quests across multiple Avalanche games and dApps.",
              },
              {
                icon: "✅",
                title: "Verified On-Chain",
                desc: "Every action is verified through blockchain events — no faking it.",
              },
              {
                icon: "⚡",
                title: "Earn XP & Level Up",
                desc: "Accumulate XP, unlock badges, and climb the leaderboard.",
              },
              {
                icon: "🎭",
                title: "Evolve Identity",
                desc: "Your dynamic NFT evolves based on your cross-game achievements.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 bg-arena-card rounded-xl border border-arena-border hover:border-arena-accent/30 transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-arena-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "∞", label: "Games Supported" },
              { value: "0→100", label: "Level Range" },
              { value: "6", label: "Tier Ranks" },
              { value: "100%", label: "On-Chain" },
            ].map((stat, i) => (
              <div key={i} className="p-6">
                <div className="text-3xl font-bold text-arena-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Arena Is Different
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-arena-border text-gray-500">
                  <th className="py-3 px-4 text-left">Feature</th>
                  <th className="py-3 px-4 text-center">Traditional</th>
                  <th className="py-3 px-4 text-center text-arena-accent">Arena</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Ownership", "Platform owns", "You own"],
                  ["Cross-game", "❌ Siloed", "✅ Unified"],
                  ["Verification", "Trust-based", "On-chain proof"],
                  ["Identity", "Static profile", "Evolving NFT"],
                  ["Transferable", "❌ Locked", "✅ Wallet-based"],
                ].map(([feature, trad, arena], i) => (
                  <tr key={i} className="border-b border-arena-border/30">
                    <td className="py-3 px-4 text-white">{feature}</td>
                    <td className="py-3 px-4 text-center text-gray-500">{trad}</td>
                    <td className="py-3 px-4 text-center text-arena-green">{arena}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Level Up?
          </h2>
          <p className="text-gray-400 mb-8">
            Connect your wallet and start building your cross-game identity.
          </p>
          <button className="bg-arena-accent text-white px-10 py-4 rounded-xl font-medium text-lg hover:bg-arena-accent/80 transition-all hover:shadow-lg hover:shadow-arena-accent/20 animate-glow">
            Connect Wallet & Enter Arena
          </button>
        </div>
      </section>
    </div>
  );
}
