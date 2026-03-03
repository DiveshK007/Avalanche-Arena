"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";

/**
 * UX Enhancement #24 — Prefetch on Hover
 *
 * Prefetches routes when user hovers over navigation links.
 * Next.js already prefetches <Link> in viewport, but this
 * adds explicit prefetch on hover for non-viewport links.
 */

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function PrefetchLink({ href, children, className, onClick }: PrefetchLinkProps) {
  const router = useRouter();

  const handleMouseEnter = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
