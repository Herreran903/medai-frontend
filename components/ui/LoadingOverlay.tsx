"use client";

/**
 * Full-screen loading overlay component for the MedAI frontend.
 *
 * This module provides a blocking overlay that prevents user interaction during
 * long-running operations such as entity extraction, batch processing, or note
 * retrieval. The overlay is essential for maintaining data integrity and preventing
 * duplicate submissions in clinical workflows.
 *
 * @remarks
 * The component uses React Portal to render outside the normal component hierarchy,
 * ensuring it covers the entire viewport regardless of parent component positioning
 * or overflow settings. This is a client-only component due to the portal requirement.
 *
 * @example
 * ```tsx
 * import { LoadingOverlay } from "@/components/ui";
 *
 * function ExtractionForm() {
 *   const [isProcessing, setIsProcessing] = useState(false);
 *
 *   const handleSubmit = async () => {
 *     setIsProcessing(true);
 *     try {
 *       await extractEntities(formData);
 *     } finally {
 *       setIsProcessing(false);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <form onSubmit={handleSubmit}>...</form>
 *       <LoadingOverlay show={isProcessing} text="Extracting entities..." />
 *     </>
 *   );
 * }
 * ```
 *
 * @module LoadingOverlay
 */

import React from "react";
import { createPortal } from "react-dom";
import { Spin, Typography } from "antd";

/**
 * Default overlay label displayed during loading states.
 *
 * Centralized to maintain consistent UI copy across extraction workflows
 * without duplicating string literals in multiple components.
 *
 * @internal
 */
const DEFAULT_OVERLAY_TEXT = "Procesando…";

/**
 * Props for the {@link LoadingOverlay} component.
 *
 * @example
 * ```tsx
 * const props: LoadingOverlayProps = {
 *   show: true,
 *   text: "Analyzing clinical note..."
 * };
 * ```
 */
export type LoadingOverlayProps = {
  /**
   * Controls the visibility of the loading overlay.
   *
   * When `true`, the overlay renders as a full-screen blocking element that
   * prevents all user interaction with the underlying UI. When `false`, the
   * component renders nothing.
   *
   * @remarks
   * Toggle this based on async operation state (e.g., API request pending).
   * The overlay should be shown immediately when an operation starts and
   * hidden in the finally block to ensure cleanup on both success and error.
   */
  show: boolean;

  /**
   * Accessible label displayed beneath the loading spinner.
   *
   * Provides context to users about what operation is in progress. Should be
   * concise but descriptive enough to set appropriate expectations about wait time.
   *
   * @defaultValue "Processing…"
   *
   * @example
   * ```tsx
   * <LoadingOverlay show={true} text="Extracting entities from clinical note..." />
   * <LoadingOverlay show={true} text="Processing batch upload (3 files)..." />
   * ```
   */
  text?: string;
};

/**
 * Full-screen blocking overlay for long-running operations.
 *
 * This component renders a semi-transparent overlay with a centered spinner and
 * status text, preventing user interaction while the Backend API processes data.
 * It is essential for clinical workflows where duplicate submissions or premature
 * navigation could cause data integrity issues.
 *
 * @remarks
 * **Implementation Details:**
 * - Uses React Portal to render into `document.body`, ensuring the overlay covers
 *   the entire viewport regardless of parent component structure.
 * - Includes `aria-live="polite"` and `aria-busy="true"` for screen reader accessibility.
 * - Applies a subtle backdrop blur effect for visual distinction without completely
 *   obscuring the underlying content.
 * - Uses z-index 9999 to ensure it appears above all other UI elements.
 *
 * **Client-Only Behavior:**
 * This component requires the DOM and will return `null` during server-side rendering.
 * The "use client" directive ensures it only executes in the browser environment.
 *
 * **Usage Guidelines:**
 * - Show the overlay immediately when starting an async operation
 * - Hide the overlay in a `finally` block to ensure cleanup on error
 * - Provide descriptive text that helps users understand the wait
 * - Avoid showing the overlay for operations under 300ms to prevent flicker
 *
 * @param props - Component props including visibility state and display text.
 * @returns A portal-rendered overlay element, or null when hidden or during SSR.
 *
 * @example
 * ```tsx
 * // Basic usage with default text
 * <LoadingOverlay show={isLoading} />
 *
 * // Custom loading message
 * <LoadingOverlay
 *   show={isExtracting}
 *   text="Analyzing clinical note for entities..."
 * />
 *
 * // In an async handler
 * const handleExtract = async () => {
 *   setLoading(true);
 *   try {
 *     const result = await extractEntities(formData);
 *     router.push(`/results/${result.id}`);
 *   } catch (err) {
 *     notify.error(toUserMessage(err));
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, text = DEFAULT_OVERLAY_TEXT }) => {
  if (!show || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-2 rounded-md p-4">
        <Spin size="large" />
        <Typography.Text>{text}</Typography.Text>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
