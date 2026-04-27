/**
 * API client functions for the MedAI Backend extraction endpoints.
 *
 * This module centralizes all HTTP communication with the Backend API, providing
 * typed wrapper functions for entity extraction operations. By isolating network
 * calls here, UI components remain focused on clinical workflows while error
 * handling and request formatting stay consistent across the application.
 *
 * @remarks
 * All request payloads use FormData to support multipart uploads containing
 * text content, file attachments, and extraction configuration parameters.
 * Field names must match the Backend API contract exactly.
 *
 * The module exports both primary functions (with `Ack` suffix indicating
 * acknowledgement-style responses) and convenience aliases for backward
 * compatibility with existing UI components.
 *
 * @see {@link https://herreran903.github.io/docs-medai/ | MedAI API Documentation}
 *
 * @example
 * ```typescript
 * import { extractEntitiesAck, fetchNote } from "@/lib/api";
 * import { notify, toUserMessage } from "@/lib";
 *
 * async function processNote(formData: FormData) {
 *   const close = notify.loading("Extracting entities...");
 *   try {
 *     const ack = await extractEntitiesAck(formData);
 *     close();
 *
 *     if (ack.result) {
 *       // Backend returned inline results
 *       return ack.result;
 *     }
 *
 *     // Fetch full results using the note ID
 *     return await fetchNote(ack.id);
 *   } catch (err) {
 *     close();
 *     notify.error(toUserMessage(err));
 *     throw err;
 *   }
 * }
 * ```
 *
 * @module api
 */

import { http } from "./http";
import { BatchAckResponse, ExtractAck, ExtractResponse } from "./types";

/**
 * Requests entity extraction for a single clinical text or file input.
 *
 * This function initiates the primary extraction workflow in MedAI, sending
 * clinical text or a document file to the Backend API for NER processing.
 * The backend responds with an acknowledgement containing the note ID and
 * optionally the full extraction results if processing completed synchronously.
 *
 * @remarks
 * **Expected FormData fields:**
 * - `text` — Raw clinical text content (mutually exclusive with `file`)
 * - `file` — Uploaded document file (mutually exclusive with `text`)
 * - `episode_id` — Clinical episode or encounter identifier
 * - `note_date` — Clinical note timestamp (ISO 8601)
 * - `model` — NER model identifier (`crf`, `lstm`, `lstm_crf`, `transformer`, `llm`)
 * - `model_variant` — Optional model variant or configuration
 *
 * The function is used by the single-upload component for individual note
 * processing workflows.
 *
 * @param formData - Multipart form data containing the clinical text or file
 *                   and extraction configuration parameters.
 * @returns Promise resolving to an {@link ExtractAck} with the note ID and
 *          optional inline results.
 * @throws {@link ApiError} on network failures, validation errors, or server errors.
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("text", clinicalNote);
 * formData.append("episode_id", "EP-001");
 * formData.append("note_date", new Date().toISOString());
 * formData.append("model", "transformer");
 *
 * const ack = await extractEntitiesAck(formData);
 * console.log(`Note stored with ID: ${ack.id}`);
 * ```
 */
export async function extractEntitiesAck(formData: FormData): Promise<ExtractAck> {
  const { data } = await http.post<ExtractAck>("/extract", formData);
  return data;
}

/**
 * Retrieves a stored note and its extracted entities by ID.
 *
 * This function fetches the complete extraction results for a previously
 * processed clinical note. Use this after receiving an {@link ExtractAck}
 * or {@link BatchAckItem} to obtain the full entity list and metadata.
 *
 * @remarks
 * The note ID is URL-encoded to handle special characters safely. The
 * response includes the original text, all extracted entities with their
 * offsets, normalized values, and backend metadata.
 *
 * This function is typically called:
 * - After single extraction when `ExtractAck.result` is null
 * - When navigating to a results page via `/results/[id]`
 * - When refreshing or revisiting previously processed notes
 *
 * @param noteId - The unique identifier returned by extraction endpoints.
 * @returns Promise resolving to an {@link ExtractResponse} with full results.
 * @throws {@link ApiError} with status 404 if the note ID does not exist.
 *
 * @example
 * ```typescript
 * // After receiving an acknowledgement
 * const ack = await extractEntitiesAck(formData);
 *
 * // Fetch full results if not inlined
 * const response = ack.result ?? await fetchNote(ack.id);
 * console.log(`Found ${response.entities.length} entities`);
 * ```
 */
export async function fetchNote(noteId: string): Promise<ExtractResponse> {
  const { data } = await http.get<ExtractResponse>(`/notes/${encodeURIComponent(noteId)}`);
  return data;
}

/**
 * Requests batch extraction for multiple clinical files in a single request.
 *
 * This function enables bulk processing of clinical documents, sending multiple
 * files to the Backend API for parallel NER extraction. The response contains
 * per-file status information suitable for rendering in status tables.
 *
 * @remarks
 * **Expected FormData fields:**
 * - `files` — Repeated field containing multiple file uploads
 * - `model` — NER model identifier
 * - `model_variant` — Optional model variant or configuration
 * - `notes_meta` — JSON-encoded metadata for each file
 *
 * The function is used by the batch-upload component for multi-file
 * processing workflows. Each file in the batch is processed independently,
 * and failures in one file do not affect others.
 *
 * @param formData - Multipart form data containing multiple files and
 *                   extraction configuration parameters.
 * @returns Promise resolving to a {@link BatchAckResponse} with per-file status.
 * @throws {@link ApiError} on network failures or request-level errors.
 *         Individual file errors are reported in the response items.
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * files.forEach(file => formData.append("files", file));
 * formData.append("model", "transformer");
 *
 * const response = await extractEntitiesBatchAck(formData);
 *
 * const successful = response.items.filter(item => item.stored);
 * const failed = response.items.filter(item => item.error);
 * console.log(`Processed ${successful.length}/${response.items.length} files`);
 * ```
 */
export async function extractEntitiesBatchAck(formData: FormData): Promise<BatchAckResponse> {
  const { data } = await http.post<BatchAckResponse>("/extract-batch", formData);
  return data;
}

/**
 * Convenience alias for {@link extractEntitiesAck}.
 *
 * Maintained for backward compatibility with existing UI components that
 * use the shorter function name. New code should prefer `extractEntitiesAck`
 * for clarity about the acknowledgement-style response.
 *
 * @param formData - Multipart form data for extraction.
 * @returns Promise resolving to an {@link ExtractAck}.
 * @deprecated Prefer {@link extractEntitiesAck} for new code.
 */
export async function extractEntities(formData: FormData): Promise<ExtractAck> {
  return extractEntitiesAck(formData);
}

/**
 * Convenience alias for {@link extractEntitiesBatchAck}.
 *
 * Maintained for backward compatibility with existing UI components that
 * use the shorter function name. New code should prefer `extractEntitiesBatchAck`
 * for clarity about the acknowledgement-style response.
 *
 * @param formData - Multipart form data for batch extraction.
 * @returns Promise resolving to a {@link BatchAckResponse}.
 * @deprecated Prefer {@link extractEntitiesBatchAck} for new code.
 */
export async function extractEntitiesBatch(formData: FormData): Promise<BatchAckResponse> {
  return extractEntitiesBatchAck(formData);
}

/**
 * Downloads the extraction result for a note as an Excel file (.xlsx).
 *
 * The file contains two sheets:
 * - **"Resultados"**: raw entity data (type, text, code, start, end).
 * - **"Normalizado"**: entity type and clean numeric/text value.
 *
 * @param noteId - The unique note identifier returned by extraction endpoints.
 * @returns Promise resolving to a Blob with the Excel file content.
 * @throws {@link ApiError} with status 404 if the note ID does not exist.
 *
 * @example
 * ```typescript
 * const blob = await downloadNoteExcel(noteId);
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement("a");
 * a.href = url;
 * a.download = "resultados.xlsx";
 * a.click();
 * URL.revokeObjectURL(url);
 * ```
 */
export async function downloadNoteExcel(noteId: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/notes/${encodeURIComponent(noteId)}/export`, {
    responseType: "blob",
  });
  return data;
}
