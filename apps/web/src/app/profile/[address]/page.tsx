"use client";

import dynamic from "next/dynamic";

const ProfileContent = dynamic(() => import("./ProfileContent"), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="animate-pulse bg-arena-card rounded-2xl h-64 border border-arena-border" />
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfileContent />;
}
