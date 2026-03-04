import dynamic from "next/dynamic";

export const revalidate = 0;

const CrossChainContent = dynamic(() => import("./CrossChainContent"), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Cross-Chain Hub</h1>
      <p className="text-gray-500 mb-8">Loading...</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 animate-pulse bg-arena-card rounded-2xl h-80 border border-arena-border" />
        <div className="space-y-6">
          <div className="animate-pulse bg-arena-card rounded-2xl h-48 border border-arena-border" />
          <div className="animate-pulse bg-arena-card rounded-2xl h-32 border border-arena-border" />
        </div>
      </div>
    </div>
  ),
});

export default function CrossChainPage() {
  return <CrossChainContent />;
}
