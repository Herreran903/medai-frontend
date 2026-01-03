"use client";

/**
 * Loading state component for the app route group.
 *
 * This component is automatically rendered by Next.js while page content
 * is being loaded or during navigation transitions within the (app) route group.
 *
 * @remarks
 * Uses Ant Design's fullscreen Spin component to provide a consistent
 * loading experience across all pages in the application.
 *
 * @module app/(app)/loading
 */

import { Spin } from "antd";

/**
 * Fullscreen loading indicator for page transitions.
 *
 * @returns A fullscreen spinner with loading message.
 */
export default function Loading() {
  return <Spin fullscreen tip="Cargando…" />;
}
