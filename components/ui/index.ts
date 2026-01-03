/**
 * UI components barrel export for the MedAI frontend.
 *
 * This module re-exports shared UI components that are used across multiple
 * features in the application. These components provide consistent visual
 * patterns and behavior for common UI needs.
 *
 * @example
 * ```typescript
 * import { LoadingOverlay } from "@/components/ui";
 * import type { LoadingOverlayProps } from "@/components/ui";
 * ```
 *
 * @module components/ui
 */

/**
 * Re-exports the LoadingOverlay component and its props type.
 * @see {@link module:LoadingOverlay}
 */
export { default as LoadingOverlay } from "./LoadingOverlay";
export type { LoadingOverlayProps } from "./LoadingOverlay";
