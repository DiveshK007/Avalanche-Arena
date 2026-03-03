"use client";

/**
 * UX Enhancement #2 — Skeleton Loading States
 *
 * Reusable skeleton components that match the shape of real content.
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-arena-border/50 rounded ${className}`}
    />
  );
}

// ── Skeleton variants for specific components ──

export function QuestCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-arena-border bg-arena-card">
      <Skeleton className="w-20 h-3 mb-3 rounded-full" />
      <Skeleton className="w-3/4 h-5 mb-2" />
      <Skeleton className="w-full h-3 mb-1" />
      <Skeleton className="w-2/3 h-3 mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-4 rounded-full" />
          <Skeleton className="w-14 h-4 rounded-full" />
        </div>
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
  );
}

export function IdentityCardSkeleton() {
  return (
    <div className="w-full max-w-md p-6 rounded-2xl border border-arena-border bg-arena-card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Skeleton className="w-20 h-3 mb-2" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <Skeleton className="w-24 h-6 rounded-full mb-4" />
      <Skeleton className="w-full h-3 rounded-full mb-5" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-arena-bg/50 rounded-lg p-3 text-center">
            <Skeleton className="w-12 h-5 mx-auto mb-1" />
            <Skeleton className="w-10 h-3 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex gap-4 items-center py-3 px-4">
      <Skeleton className="w-8 h-4" />
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-16 h-5 rounded-full" />
      <div className="flex-1" />
      <Skeleton className="w-10 h-4" />
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-10 h-4" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-arena-card border border-arena-border rounded-xl p-4 text-center">
      <Skeleton className="w-16 h-7 mx-auto mb-2" />
      <Skeleton className="w-20 h-3 mx-auto" />
    </div>
  );
}

export function AchievementCardSkeleton() {
  return (
    <div className="p-5 bg-arena-card rounded-xl border border-arena-border">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-full h-3 mb-1" />
      <Skeleton className="w-2/3 h-3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Skeleton className="w-40 h-8 mb-2" />
      <Skeleton className="w-64 h-4 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <IdentityCardSkeleton />
          <div className="p-4 bg-arena-card rounded-xl border border-arena-border space-y-3">
            <Skeleton className="w-32 h-3 mb-3" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-12 h-3" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="flex justify-between mb-6">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-20 h-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <QuestCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
