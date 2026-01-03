/**
 * HTTP client configuration and error handling for the MedAI Backend API.
 *
 * This module provides a pre-configured Axios instance and error normalization
 * utilities that ensure consistent HTTP communication and error handling across
 * all API interactions in the MedAI frontend.
 *
 * @remarks
 * The module implements a centralized error handling strategy that:
 * - Normalizes all API errors into a consistent {@link ApiError} type
 * - Extracts user-friendly messages from FastAPI validation errors (422)
 * - Handles network failures and timeouts gracefully
 * - Preserves raw error details for debugging and logging
 *
 * @example
 * ```typescript
 * import { http, ApiError, toUserMessage } from "@/lib/http";
 *
 * try {
 *   const { data } = await http.post("/extract", formData);
 *   return data;
 * } catch (err) {
 *   if (err instanceof ApiError && err.status === 413) {
 *     notify.error("File exceeds maximum size limit");
 *   } else {
 *     notify.error(toUserMessage(err));
 *   }
 * }
 * ```
 *
 * @module http
 */

import axios, { AxiosError, AxiosResponse } from "axios";

/**
 * Normalized error type for Backend API failures.
 *
 * This custom error class wraps all HTTP errors from the Backend API into a
 * consistent structure that preserves status codes, raw error details, and
 * network failure indicators. Use this type for error handling throughout
 * the application to maintain consistent error processing.
 *
 * @remarks
 * The Axios response interceptor automatically converts all API errors into
 * `ApiError` instances, so catch blocks can reliably use `instanceof ApiError`
 * to identify backend failures versus other runtime errors.
 *
 * @example
 * ```typescript
 * try {
 *   await extractEntities(formData);
 * } catch (err) {
 *   if (err instanceof ApiError) {
 *     console.error(`API Error ${err.status}: ${err.message}`);
 *     console.debug("Raw detail:", err.detail);
 *
 *     if (err.isNetwork) {
 *       // Handle connectivity issues
 *       showOfflineWarning();
 *     }
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /**
   * HTTP status code from the failed response.
   *
   * Undefined when the error is a network failure (no response received).
   * Common values:
   * - `400` — Bad request / invalid input
   * - `401` — Unauthorized
   * - `403` — Forbidden
   * - `404` — Resource not found
   * - `413` — Payload too large (file size exceeded)
   * - `415` — Unsupported media type
   * - `422` — Validation error (FastAPI)
   * - `500+` — Server errors
   */
  status?: number;

  /**
   * Raw backend detail payload for troubleshooting.
   *
   * Contains the unprocessed error response body from the Backend API.
   * The structure varies by error type but typically includes FastAPI's
   * `detail` field with validation error arrays or error messages.
   */
  detail?: unknown;

  /**
   * Indicates whether the error is a network or connectivity failure.
   *
   * `true` when no HTTP response was received, indicating issues such as:
   * - Server unreachable (CORS, DNS, firewall)
   * - Network disconnection
   * - Request timeout (handled separately via `ECONNABORTED`)
   */
  isNetwork?: boolean;

  /**
   * Creates a new ApiError instance.
   *
   * @param message - Human-readable error message for display.
   * @param opts - Optional error metadata.
   * @param opts.status - HTTP status code from the response.
   * @param opts.detail - Raw error payload from the backend.
   * @param opts.isNetwork - Whether this is a network-level failure.
   */
  constructor(
    message: string,
    opts: { status?: number; detail?: unknown; isNetwork?: boolean } = {}
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ApiError";
    this.status = opts.status;
    this.detail = opts.detail;
    this.isNetwork = opts.isNetwork;
  }
}

/**
 * Extracts a human-readable message from Backend API detail fields.
 *
 * Handles the various error response formats returned by the Backend API:
 * - Simple string messages
 * - FastAPI 422 validation error arrays with `loc` and `msg` fields
 * - Nested objects with `message` or `detail` properties
 *
 * @param detail - The raw detail payload from the API response.
 * @returns A formatted error message string, or null if no detail provided.
 *
 * @internal
 */
function extractDetail(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (d && typeof d === "object") {
          const obj = d as Record<string, unknown>;
          const loc = Array.isArray(obj.loc)
            ? (obj.loc as unknown[]).join(".")
            : ((obj.loc as string) ?? "");
          const msg = (obj.msg as string) ?? (obj.message as string) ?? "";
          return [loc, msg].filter(Boolean).join(": ");
        }
        return null;
      })
      .filter(Boolean) as string[];
    if (parts.length) return parts.join(" | ");
  }

  if (typeof detail === "object") {
    const obj = detail as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }

  return String(detail);
}

/**
 * Converts any error into a user-facing message suitable for clinical UI display.
 *
 * This function provides a consistent error messaging strategy across the entire
 * MedAI frontend by translating technical error details into clear, actionable
 * messages appropriate for healthcare professionals using the application.
 *
 * @remarks
 * The function handles three categories of errors:
 * 1. {@link ApiError} instances (from the response interceptor)
 * 2. Raw Axios errors (for edge cases bypassing the interceptor)
 * 3. Generic JavaScript errors and strings
 *
 * Status code mapping follows clinical software UX best practices:
 * - Network errors emphasize connectivity issues
 * - Validation errors (422) preserve backend detail when available
 * - Server errors (5xx) use generic messaging to avoid exposing internals
 *
 * @param err - Any error value caught in a try/catch block.
 * @returns A user-friendly error message string suitable for display in notifications.
 *
 * @example
 * ```typescript
 * import { toUserMessage } from "@/lib/http";
 * import { notify } from "@/lib/notifications";
 *
 * try {
 *   await extractEntities(formData);
 * } catch (err) {
 *   // Displays: "File too large" for 413, "Invalid parameters" for 422, etc.
 *   notify.error(toUserMessage(err));
 * }
 * ```
 */
export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const status = err.status;
    const message = err.message || "Error en la solicitud";
    if (!status) return message || "No se pudo conectar con el servidor";

    if (status === 400) return message || "Solicitud invalida";
    if (status === 401) return "No autorizado";
    if (status === 403) return "Acceso denegado";
    if (status === 404) return message || "Recurso no encontrado";
    if (status === 413) return "Archivo demasiado grande";
    if (status === 415) return "Tipo de archivo no soportado";
    if (status === 422) return message || "Parametros invalidos";
    if (status >= 500) return "Error interno del servidor";
    return message || "Error en la solicitud";
  }

  const axErr = axios.isAxiosError(err) ? (err as AxiosError) : null;
  if (axErr) {
    const status = axErr.response?.status;
    const rawData = axErr.response?.data as unknown;

    let detail: string | null = null;
    if (rawData && typeof rawData === "object") {
      const obj = rawData as Record<string, unknown>;
      const maybeDetail = (obj as { detail?: unknown }).detail;
      const maybeMessage = (obj as { message?: unknown }).message;
      detail = extractDetail(maybeDetail ?? maybeMessage ?? rawData);
    } else {
      detail = extractDetail(rawData);
    }

    const msg = detail || axErr.message || "Error de red";

    if (axErr.code === "ECONNABORTED") return "Tiempo de espera agotado";
    if (!status) return "No se pudo conectar con el servidor";
    if (status === 404) return detail || "Recurso no encontrado";
    if (status === 413) return "Archivo demasiado grande";
    if (status === 415) return "Tipo de archivo no soportado";
    if (status === 422) return detail || "Parametros invalidos";
    if (status >= 500) return "Error interno del servidor";
    return msg;
  }

  if (err instanceof Error) return err.message || "Error inesperado";
  if (typeof err === "string") return err;
  return "Error inesperado";
}

/**
 * Pre-configured Axios instance for Backend API communication.
 *
 * This instance is configured with the MedAI Backend API base URL and appropriate
 * timeouts for clinical text processing operations, which may involve large files
 * and complex NER model inference.
 *
 * @remarks
 * Configuration details:
 * - **Base URL**: Set via `NEXT_PUBLIC_BACKEND_URL` environment variable,
 *   defaults to `http://localhost:8000` for local development.
 * - **Timeout**: 20 minutes (1,200,000ms) to accommodate batch processing
 *   of multiple clinical documents.
 * - **Credentials**: Disabled (`withCredentials: false`) as the API uses
 *   stateless authentication patterns.
 *
 * The instance includes a response interceptor that automatically converts
 * all error responses into {@link ApiError} instances for consistent handling.
 *
 * @example
 * ```typescript
 * import { http } from "@/lib/http";
 *
 * // Direct usage (prefer the api.ts wrapper functions)
 * const { data } = await http.get<ExtractResponse>(`/notes/${noteId}`);
 *
 * // POST with FormData
 * const { data } = await http.post<ExtractAck>("/extract", formData);
 * ```
 */
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  timeout: 1200000,
  withCredentials: false,
});

/**
 * Response interceptor that normalizes all HTTP errors into {@link ApiError} instances.
 *
 * This interceptor ensures consistent error handling across the application by:
 * - Extracting user-friendly messages from FastAPI error responses
 * - Detecting network failures and timeouts
 * - Preserving raw error details for debugging
 * - Providing sensible fallback messages for common HTTP status codes
 *
 * @remarks
 * The interceptor runs on every failed HTTP response, so all errors caught
 * in API call catch blocks will be `ApiError` instances (unless the error
 * occurred before the request was made, e.g., during FormData construction).
 *
 * @internal
 */
http.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: unknown) => {
    const axErr = error as AxiosError;
    const status = axErr?.response?.status;
    const rawData = axErr?.response?.data as unknown;

    let extractedDetail: string | null = null;
    if (rawData && typeof rawData === "object") {
      const obj = rawData as Record<string, unknown>;
      const maybeDetail = (obj as { detail?: unknown }).detail;
      const maybeMessage = (obj as { message?: unknown }).message;
      extractedDetail = extractDetail(maybeDetail ?? maybeMessage ?? rawData);
    } else {
      extractedDetail = extractDetail(rawData);
    }

    let msg: string = extractedDetail || axErr?.message || "Error de red";
    let isNetwork = false;

    if (axErr.code === "ECONNABORTED") {
      msg = "Tiempo de espera agotado";
    } else if (!status) {
      /* CORS or server unavailable scenarios. */
      msg = "No se pudo conectar con el servidor";
      isNetwork = true;
    } else {
      /* Friendly fallbacks when no detail is provided. */
      if (status === 404 && !extractedDetail) msg = "Recurso no encontrado";
      if (status === 413) msg = "Archivo demasiado grande";
      if (status === 415) msg = "Tipo de archivo no soportado";
      if (status === 422 && !extractedDetail) msg = "Parametros invalidos";
      if (status >= 500 && !extractedDetail) msg = "Error interno del servidor";
    }

    return Promise.reject(new ApiError(msg, { status, detail: rawData, isNetwork }));
  }
);
