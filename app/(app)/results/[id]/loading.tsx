"use client";

/**
 * Route-level loading state for the results view.
 * Keeps the UI blocked while the Backend API resolves the extraction payload.
 *
 * @remarks
 * This file leverages Next.js route loading to ensure a consistent experience
 * even when navigation to a stored result is slow or retried.
 */
import LoadingOverlay from "@/components/ui/LoadingOverlay";

/**
 * Displays the full-screen loading overlay for results navigation.
 * This mirrors the extraction flow to avoid user actions during hydration.
 */
export default function Loading() {
  return <LoadingOverlay show text="Procesando extracción…" />;
}
