/**
 * Provider components barrel export for the MedAI frontend.
 *
 * This module re-exports all React Context providers used for global state
 * management in the application. Providers handle cross-cutting concerns
 * such as model configuration, user preferences, and application-wide state.
 *
 * @example
 * ```typescript
 * import {
 *   ModelSettingsProvider,
 *   useModelSettings,
 *   DEFAULTS,
 *   LOCKED_SABS
 * } from "@/components/providers";
 * ```
 *
 * @module components/providers
 */

/**
 * Re-exports model settings provider, hook, types, and constants.
 * @see {@link module:model-settings-provider}
 */
export * from "./model-settings-provider";
