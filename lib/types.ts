/**
 * Core type definitions for the MedAI frontend application.
 *
 * This module defines the data structures that mirror the Backend API contracts
 * for clinical entity extraction, optional code mappings, and batch processing. These types
 * serve as the single source of truth for data shapes flowing between the UI
 * components and the API client layer.
 *
 * @remarks
 * All types in this module are designed to be serializable and compatible with
 * JSON responses from the Backend API. Optional fields use `| null` union types
 * to explicitly handle nullable values returned by the backend.
 *
 * @see {@link https://herreran903.github.io/docs-medai/ | MedAI Documentation}
 *
 * @module types
 */

/**
 * Optional terminology code associated with an extracted clinical entity.
 *
 * Represents a mapping from an extracted entity to a standardized medical
 * vocabulary system such as SNOMED CT, RxNorm, or ICD-10. Depending on backend
 * configuration, these codes may be present to support interoperability with
 * electronic health record systems and clinical analytics workflows.
 *
 * @remarks
 * The `score` field indicates the confidence of the code mapping, not the
 * extraction confidence. A high extraction score with a low mapping score
 * suggests the entity was clearly identified but ambiguously linked.
 *
 * @example
 * ```typescript
 * const code: Code = {
 *   system: "SNOMEDCT_US",
 *   code: "386661006",
 *   display: "Fever",
 *   score: 0.95,
 *   source: "umls"
 * };
 * ```
 */
export type Code = {
  /**
   * Vocabulary system identifier.
   *
   * Common values include:
   * - `RXNORM` — Drug names and ingredients
   * - `SNOMEDCT_US` — Clinical terms and concepts
   * - `ICD10CM` — Diagnosis codes
   * - `CPT` — Procedure codes
   * - `LOINC` — Laboratory and clinical observations
   */
  system: string;

  /**
   * Code value within the vocabulary system.
   *
   * This is the unique identifier for the concept within the specified system.
   * For example, "386661006" in SNOMED CT represents "Fever".
   */
  code: string;

  /**
   * Human-readable display label for the code.
   *
   * Provided by the Backend API when available in the vocabulary system.
   * Use this for rendering in the UI rather than the raw code value.
   */
  display?: string;

  /**
   * Confidence score for the code mapping.
   *
   * A value between 0 and 1 indicating how confident the backend is that
   * this code correctly represents the extracted entity. Higher values
   * indicate stronger matches.
   *
   * @remarks
   * This score is distinct from the entity extraction score. An entity
   * may be extracted with high confidence but linked with lower confidence
   * if the term is ambiguous across vocabularies.
   */
  score?: number;

  /**
   * Source or strategy used by the backend to produce the mapping.
   *
   * Indicates which backend service or algorithm generated this code.
   * Useful for debugging and understanding the provenance of mappings.
   *
   * @example "umls", "custom_dictionary", "exact_match"
   */
  source?: string;
};

/**
 * Single entity extracted from clinical text.
 *
 * Represents a clinically relevant span of text identified by the NER
 * (Named Entity Recognition) model. This is the core data unit rendered
 * by the MedAI UI and serves as the foundation for clinical analytics,
 * coding assistance, and documentation review workflows.
 *
 * @remarks
 * The `start` and `end` offsets are character-based indices into the original
 * note text. The span is inclusive of `start` and exclusive of `end`, following
 * standard string slicing conventions: `text.slice(start, end)`.
 *
 * @example
 * ```typescript
 * const entity: Entity = {
 *   type: "MEDICATION",
 *   text: "metformin 500mg",
 *   start: 45,
 *   end: 60,
 *   score: 0.98,
 *   codes: [
 *     { system: "RXNORM", code: "861004", display: "metformin 500 MG" }
 *   ]
 * };
 * ```
 */
export type Entity = {
  /**
   * Canonical entity type emitted by the extraction model.
   *
   * The type corresponds to clinical categories defined in the model's
   * training schema. Common types include MEDICATION, DIAGNOSIS, PROCEDURE,
   * SYMPTOM, ANATOMY, and LAB_VALUE.
   *
   * @see {@link constants/entities.ts} for the full list of supported types.
   */
  type: string;

  /**
   * Raw text span exactly as it appears in the source note.
   *
   * This is the verbatim substring extracted from the clinical text,
   * preserving original casing, abbreviations, and any typos present
   * in the source document.
   */
  text: string;

  /**
   * Start offset (inclusive) of the entity span within the note text.
   *
   * Zero-based character index marking the beginning of the entity.
   * Use with `end` to highlight or extract the span from the original text.
   */
  start: number;

  /**
   * End offset (exclusive) of the entity span within the note text.
   *
   * Zero-based character index marking the position after the last
   * character of the entity. The span length is `end - start`.
   */
  end: number;

  /**
   * Model confidence score for the extraction.
   *
   * A value between 0 and 1 indicating how confident the NER model is
   * that this span represents a valid clinical entity of the specified type.
   * Not all backend configurations return this field.
   */
  score?: number;

  /**
   * Single mapped code for backward compatibility.
   *
   * @deprecated Prefer using the `codes` array which supports multiple
   * code mappings with scores. This field is maintained for compatibility
   * with older backend versions.
   */
  code?: string;

  /**
   * List of mapped terminology codes with optional scores and display labels.
   *
   * Contains zero or more {@link Code} objects representing mappings to
   * standardized medical vocabularies. Multiple codes may be present when
   * the entity maps to different vocabulary systems or when multiple
   * candidate mappings exist within the same system.
   */
  codes?: Code[];
};

/**
 * Full extraction payload returned by the Backend API.
 *
 * Contains the complete result of a clinical text extraction request,
 * including the original text, all extracted entities with their offsets
 * and optional code mappings, and backend metadata for auditability.
 *
 * @remarks
 * This type is returned by the `/notes/{id}` endpoint and may also be
 * inlined in {@link ExtractAck.result} when the backend responds synchronously.
 *
 * @example
 * ```typescript
 * const response: ExtractResponse = {
 *   text: "Patient presents with fever and cough...",
 *   entities: [
 *     { type: "SYMPTOM", text: "fever", start: 22, end: 27 },
 *     { type: "SYMPTOM", text: "cough", start: 32, end: 37 }
 *   ],
 *   meta: { model: "medai-ner-v2", processing_time_ms: 145 }
 * };
 * ```
 */
export type ExtractResponse = {
  /**
   * Original note text used for extraction.
   *
   * The full clinical text that was processed by the extraction model.
   * Entity offsets (`start`, `end`) are indices into this string.
   */
  text: string;

  /**
   * Extracted entities with offsets and optional code mappings.
   *
   * An array of {@link Entity} objects representing all clinically relevant
   * spans identified in the text. The array may be empty if no entities
   * were found or if the text was not clinical in nature.
   */
  entities: Entity[];

  /**
   * Backend metadata for auditability and troubleshooting.
   *
   * Contains implementation-specific information such as model version,
   * processing time, and configuration parameters. The structure is
   * intentionally flexible to accommodate evolving backend capabilities.
   */
  meta: Record<string, unknown>;
};

/**
 * Acknowledgement returned immediately after requesting extraction.
 *
 * This type represents the initial response from the `/extract` endpoint,
 * providing a note identifier that can be used to retrieve the full
 * extraction results via the `/notes/{id}` endpoint.
 *
 * @remarks
 * When the `result` field is present, the backend has already performed
 * the extraction synchronously and inlined the full payload. The UI should
 * still treat the `id` as the primary key for navigation and caching,
 * but can render results immediately without a follow-up fetch.
 *
 * @example
 * ```typescript
 * const ack: ExtractAck = {
 *   id: "note_abc123",
 *   stored: true,
 *   filename: "discharge_summary.txt",
 *   entity_count: 42,
 *   result: { text: "...", entities: [...], meta: {...} }
 * };
 *
 * // Navigate to results page using the id
 * router.push(`/results/${ack.id}`);
 * ```
 */
export type ExtractAck = {
  /**
   * Server-generated identifier for the stored note.
   *
   * A unique identifier assigned by the backend that serves as the primary
   * key for retrieving, referencing, and navigating to extraction results.
   */
  id: string;

  /**
   * Indicates whether the backend persisted the note and entities.
   *
   * When `true`, the note and its extracted entities have been saved to
   * the backend database and can be retrieved later via `/notes/{id}`.
   * When `false`, results are ephemeral and only available in this response.
   */
  stored: boolean;

  /**
   * Backend URL for the stored resource.
   *
   * An optional absolute URL pointing to the note resource on the backend.
   * Primarily used for debugging and direct API access.
   */
  url?: string | null;

  /**
   * Original filename when the request used file input.
   *
   * Preserved from the upload for display purposes and audit trails.
   * Null when the extraction was performed on raw text input.
   */
  filename?: string | null;

  /**
   * Episode or encounter identifier associated with the note.
   *
   * An optional clinical context identifier linking the note to a specific
   * patient encounter or episode of care. Used for EHR integration workflows.
   */
  episode_id?: string | null;

  /**
   * Clinical note date in ISO 8601 string format.
   *
   * The date associated with the clinical note, typically representing
   * when the note was authored or when the clinical encounter occurred.
   */
  note_date?: string | null;

  /**
   * Total number of entities extracted.
   *
   * A convenience count returned by the backend, useful for displaying
   * summary statistics without parsing the full entity array.
   */
  entity_count?: number | null;

  /**
   * Inline extraction result when the backend responds synchronously.
   *
   * Contains the full {@link ExtractResponse} payload when the backend
   * completes extraction before returning the acknowledgement. This
   * optimization eliminates the need for a follow-up fetch in many cases.
   */
  result?: ExtractResponse | null;
};

/**
 * Item-level status for a batch extraction request.
 *
 * Represents the processing outcome for a single file within a batch
 * upload. Each item includes success/failure status, the assigned note
 * identifier (if successful), and any error details (if failed).
 *
 * @remarks
 * The `stored` field indicates persistence success, not extraction success.
 * A file may be stored but have zero entities extracted if the content
 * was not clinical in nature.
 *
 * @example
 * ```typescript
 * const item: BatchAckItem = {
 *   filename: "note_001.txt",
 *   id: "note_xyz789",
 *   stored: true,
 *   entity_count: 15,
 *   url: "https://api.medai.com/notes/note_xyz789"
 * };
 * ```
 */
export type BatchAckItem = {
  /**
   * Filename as sent in the batch payload.
   *
   * The original filename from the uploaded file, used for display
   * in status tables and error reporting.
   */
  filename: string;

  /**
   * Stored note identifier when available.
   *
   * The unique identifier assigned by the backend for successfully
   * processed files. Null or undefined when processing failed.
   */
  id?: string | null;

  /**
   * Indicates whether the backend persisted this note.
   *
   * `true` when the file was successfully processed and stored;
   * `false` when processing failed or storage was disabled.
   */
  stored: boolean;

  /**
   * Total number of entities extracted for this file.
   *
   * Provided when extraction completed successfully. Useful for
   * displaying per-file statistics in batch result tables.
   */
  entity_count?: number | null;

  /**
   * Backend URL for the stored resource.
   *
   * An optional absolute URL for direct API access to the note.
   */
  url?: string | null;

  /**
   * Error message reported by the backend for this file.
   *
   * Contains a human-readable error description when processing failed.
   * Null or undefined for successfully processed files.
   */
  error?: string | null;
};

/**
 * Batch acknowledgement with per-file status and identifiers.
 *
 * The response type for the `/extract-batch` endpoint, containing
 * processing results for all files submitted in a batch upload request.
 * Use this response to populate status tables and enable navigation
 * to individual extraction results.
 *
 * @example
 * ```typescript
 * const response: BatchAckResponse = {
 *   items: [
 *     { filename: "note_001.txt", id: "abc", stored: true, entity_count: 10 },
 *     { filename: "note_002.txt", id: "def", stored: true, entity_count: 25 },
 *     { filename: "invalid.pdf", stored: false, error: "Unsupported file type" }
 *   ]
 * };
 *
 * // Filter successful items for navigation
 * const successful = response.items.filter(item => item.stored && item.id);
 * ```
 */
export type BatchAckResponse = {
  /**
   * List of acknowledgements for each file in the batch.
   *
   * Contains one {@link BatchAckItem} per file submitted in the request,
   * in the same order as the original upload. Check each item's `stored`
   * and `error` fields to determine processing outcome.
   */
  items: BatchAckItem[];
};
