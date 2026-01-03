"use client";

/**
 * Route-level loading state for the results view.
 *
 * Keeps the UI blocked while the Backend API resolves the extraction payload.
 * This provides immediate visual feedback during navigation to the results route.
 *
 * @remarks
 * This file leverages Next.js App Router streaming to ensure a consistent
 * experience even when navigation to a stored result is slow or retried.
 * The loading component is automatically rendered by Next.js when navigating
 * to `/results/[id]` while the page component is loading.
 *
 * @module app/(app)/results/[id]/loading
 */

import LoadingOverlay from "@/components/ui/LoadingOverlay";

/**
 * Displays the full-screen loading overlay for results navigation.
 *
 * This mirrors the extraction flow to avoid user actions during hydration.
 *
 * @returns A full-screen loading overlay with extraction status message.
 */
export default function Loading() {
  return <LoadingOverlay show text="Loading extraction results…" />;
}
