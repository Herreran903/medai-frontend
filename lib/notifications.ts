"use client";

/**
 * Shared notification helper for MedAI UI feedback.
 *
 * This module provides a unified notification API that wraps Ant Design's message
 * system to ensure consistent tone, duration, and visual weight across all clinical
 * workflows in the MedAI frontend.
 *
 * @remarks
 * All notification functions are client-side only due to the "use client" directive.
 * The module centralizes user-facing feedback to maintain a professional, consistent
 * experience when displaying extraction progress, validation errors, and success states.
 *
 * @example
 * ```typescript
 * import { notify } from "@/lib/notifications";
 *
 * // Show loading during extraction
 * const close = notify.loading("Extracting entities...");
 * try {
 *   await extractEntities(formData);
 *   close();
 *   notify.success("Extraction complete");
 * } catch (err) {
 *   close();
 *   notify.error(toUserMessage(err));
 * }
 * ```
 *
 * @module notifications
 */

import { message } from "antd";

/**
 * Default loading copy used across MedAI workflows.
 *
 * Centralized to keep UI language consistent without duplicating string literals
 * across components. This value is used when no custom message is provided to
 * the {@link notify.loading} function.
 *
 * @internal
 */
const DEFAULT_LOADING_TEXT = "Procesando…";

/**
 * Callback function to close a persistent loading notification.
 *
 * Returned by {@link notify.loading} to allow callers to dismiss the loading
 * indicator once the async operation completes, whether successfully or with an error.
 *
 * @example
 * ```typescript
 * const close: CloseFn = notify.loading();
 * // ... perform async work
 * close(); // Dismiss the loading indicator
 * ```
 */
export type CloseFn = () => void;

/**
 * @deprecated Use {@link CloseFn} instead. Maintained for backward compatibility.
 */
export type CerrarFn = CloseFn;

/**
 * Displays an informational toast message for short, non-blocking feedback.
 *
 * Use this function for validation nudges, neutral status updates, and
 * non-critical information that does not require user action. The message
 * auto-dismisses after the specified duration.
 *
 * @param text - The message content to display to the user.
 * @param duration - Time in seconds before auto-dismiss.
 * @defaultValue duration - 3 seconds
 *
 * @example
 * ```typescript
 * notify.info("Select at least one entity type to filter results");
 * ```
 */
function info(text: string, duration = 3): void {
  message.open({
    type: "info",
    content: text,
    duration,
  });
}

/**
 * Displays a success toast message for completed operations.
 *
 * Use this function when the Backend API has acknowledged or completed
 * processing, such as after successful entity extraction, batch upload
 * completion, or note retrieval. The message auto-dismisses after the
 * specified duration.
 *
 * @param text - The success message content to display.
 * @param duration - Time in seconds before auto-dismiss.
 * @defaultValue duration - 3 seconds
 *
 * @example
 * ```typescript
 * notify.success("Extraction complete — 42 entities found");
 * ```
 */
function success(text: string, duration = 3): void {
  message.open({
    type: "success",
    content: text,
    duration,
  });
}

/**
 * Displays an error toast message for failed requests or invalid input.
 *
 * Use this function in conjunction with {@link toUserMessage} from the
 * http module to ensure consistent, user-friendly error messaging across
 * the application. The longer default duration (5 seconds) gives users
 * time to read error details.
 *
 * @param text - The error message content to display.
 * @param duration - Time in seconds before auto-dismiss.
 * @defaultValue duration - 5 seconds
 *
 * @example
 * ```typescript
 * import { toUserMessage } from "@/lib/http";
 *
 * try {
 *   await extractEntities(formData);
 * } catch (err) {
 *   notify.error(toUserMessage(err));
 * }
 * ```
 */
function error(text: string, duration = 5): void {
  message.open({
    type: "error",
    content: text,
    duration,
  });
}

/**
 * Displays a persistent loading indicator until explicitly closed.
 *
 * Use this function during long-running operations such as entity extraction,
 * batch file processing, or note retrieval. Unlike other notification types,
 * this indicator does not auto-dismiss; the caller must invoke the returned
 * {@link CloseFn} to remove it.
 *
 * @remarks
 * Only one global loading indicator is shown at a time. Subsequent calls
 * replace the existing loading message content but use the same key,
 * preventing multiple overlapping spinners.
 *
 * @param text - The loading message content to display.
 * @defaultValue text - "Processing…"
 * @returns A callback function to dismiss the loading indicator.
 *
 * @example
 * ```typescript
 * const close = notify.loading("Extracting entities from clinical note...");
 * try {
 *   const result = await extractEntities(formData);
 *   close();
 *   notify.success("Extraction complete");
 * } catch (err) {
 *   close();
 *   notify.error(toUserMessage(err));
 * }
 * ```
 */
function loading(text = DEFAULT_LOADING_TEXT): CloseFn {
  const key = "global-loading";
  message.open({
    key,
    type: "loading",
    content: text,
    duration: 0,
  });
  return () => message.destroy(key);
}

/**
 * Unified notification API for the MedAI frontend.
 *
 * This object aggregates all notification functions into a single namespace,
 * providing a consistent interface for displaying user feedback throughout
 * the application. Prefer using this helper over direct Ant Design message
 * calls to maintain consistent styling and behavior.
 *
 * @example
 * ```typescript
 * import { notify } from "@/lib/notifications";
 *
 * notify.info("Hint: You can upload multiple files at once");
 * notify.success("Note saved successfully");
 * notify.error("Failed to connect to the server");
 *
 * const close = notify.loading("Processing batch...");
 * // ... async work
 * close();
 * ```
 */
export const notify = { info, success, error, loading };

/**
 * Type definition for the notify API object.
 *
 * Useful for dependency injection patterns where components or hooks
 * need to accept a notification interface as a parameter, enabling
 * easier testing and mocking.
 *
 * @example
 * ```typescript
 * function useExtraction(notifier: Notifier = notify) {
 *   const extract = async (formData: FormData) => {
 *     const close = notifier.loading();
 *     try {
 *       const result = await extractEntities(formData);
 *       close();
 *       notifier.success("Done");
 *       return result;
 *     } catch (err) {
 *       close();
 *       notifier.error(toUserMessage(err));
 *       throw err;
 *     }
 *   };
 *   return { extract };
 * }
 * ```
 */
export type Notifier = typeof notify;
