/**
 * Library module barrel export for the MedAI frontend.
 *
 * This module re-exports all public APIs from the lib/ directory, providing
 * a single import point for core functionality including API client functions,
 * HTTP utilities, notification helpers, and type definitions.
 *
 * @remarks
 * Import from this barrel module when you need multiple exports from the lib/
 * directory to keep import statements concise. For single-module imports or
 * when tree-shaking is critical, import directly from the specific module.
 *
 * @example
 * ```typescript
 * // Barrel import (convenient for multiple exports)
 * import {
 *   extractEntitiesAck,
 *   fetchNote,
 *   ApiError,
 *   toUserMessage,
 *   notify,
 *   Entity,
 *   ExtractResponse
 * } from "@/lib";
 *
 * // Direct import (explicit dependency)
 * import { extractEntitiesAck } from "@/lib/api";
 * import { notify } from "@/lib/notifications";
 * ```
 *
 * @module lib
 */

/**
 * Re-exports all API client functions for Backend communication.
 * @see {@link module:api}
 */
export * from "./api";

/**
 * Re-exports HTTP client utilities and error handling.
 * @see {@link module:http}
 */
export * from "./http";

/**
 * Re-exports notification helpers for user feedback.
 * @see {@link module:notifications}
 */
export * from "./notifications";

/**
 * Re-exports all type definitions for API contracts.
 * @see {@link module:types}
 */
export * from "./types";
