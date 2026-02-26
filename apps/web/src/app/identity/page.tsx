"use client";

import dynamic from "next/dynamic";

const IdentityContent = dynamic(() => import("./IdentityContent"), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Your Identity</h1>
      <p className="text-gray-500 mb-8">Loading...</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="animate-pulse bg-arena-card rounded-2xl h-96 border border-arena-border" />
        <div className="space-y-6">
          <div className="animate-pulse bg-arena-card rounded-xl h-40 border border-arena-border" />
          <div className="animate-pulse bg-arena-card rounded-xl h-60 border border-arena-border" />
        </div>
      </div>
    </div>
  ),
});

export default function IdentityPage() {
  return <IdentityContent />;
}
