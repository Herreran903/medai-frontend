/**
 * Constants module barrel export for the MedAI frontend.
 *
 * This module re-exports all constant definitions and configuration values
 * used throughout the application, including entity type definitions, color
 * mappings, and clinical descriptions.
 *
 * @example
 * ```typescript
 * import {
 *   BaseEntity,
 *   ENTITY_INFO,
 *   getEntityColor,
 *   getEntityDescription
 * } from "@/constants";
 * ```
 *
 * @module constants
 */

/**
 * Re-exports entity type definitions and UI configuration.
 * @see {@link module:entities}
 */
export * from "./entities";
