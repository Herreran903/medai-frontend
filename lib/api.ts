/**
 * API client for extraction endpoints.
 *
 * Endpoints implemented:
 * - POST /extract
 *   Request: FormData
 *     - text?: string              // texto plano (mutuamente excluyente con "file")
 *     - file?: File                // un solo archivo (mutuamente excluyente con "text")
 *     - model: string              // modelo de extracción
 *     - model_variant?: string     // variante opcional del modelo (ver docs/api-contract.md)
 *     - normalize?: "true"|"false" // normalización de entidades
 *     - systems_csv?: string       // CSV de SABs (p. ej. "RXNORM,SNOMEDCT_US,ICD10CM")
 *     - restrict_types_csv?: string// CSV de tipos de entidad (p. ej. "DX")
 *     - min_link_score?: string    // opcional; si el backend lo soporta
 *     - max_candidates?: string    // opcional; si el backend lo soporta
 *   Response: ExtractAck (ver tipos en lib/types.ts)
 *
 * - POST /extract-batch
 *   Request: FormData
 *     - files: File[]               // uno o más archivos (clave repetida "files")
 *     - model: string               // modelo de extracción
 *     - model_variant?: string      // variante opcional del modelo (ver docs/api-contract.md)
 *     - save?: "true"|"false"       // por defecto True; aquí lo enviamos explícito
 *     - normalize?: "true"|"false"
 *     - systems_csv?: string        // CSV de SABs (p. ej. "RXNORM,SNOMEDCT_US,ICD10CM")
 *     - restrict_types_csv?: string // CSV de tipos (p. ej. "DX")
 *   Response: BatchAckResponse (ver lib/types.ts)
 */
import { http } from "./http";
import { BatchAckResponse, ExtractAck, ExtractResponse } from "./types";

/** POST /extract — procesa un texto o un archivo y retorna un ExtractAck. */
export async function extractEntitiesAck(formData: FormData): Promise<ExtractAck> {
  const { data } = await http.post<ExtractAck>("/extract", formData);
  return data;
}

/** GET /notes/{id} — obtiene la nota almacenada junto con entidades extraídas. */
export async function fetchNote(noteId: string): Promise<ExtractResponse> {
  const { data } = await http.get<ExtractResponse>(`/notes/${encodeURIComponent(noteId)}`);
  return data;
}

/** POST /extract-batch — procesa múltiples archivos y retorna un BatchAckResponse. */
export async function extractEntitiesBatchAck(formData: FormData): Promise<BatchAckResponse> {
  const { data } = await http.post<BatchAckResponse>("/extract-batch", formData);
  return data;
}

/** Alias conveniente de extractEntitiesAck() */
export async function extractEntities(formData: FormData): Promise<ExtractAck> {
  return extractEntitiesAck(formData);
}

/** Alias conveniente de extractEntitiesBatchAck() */
export async function extractEntitiesBatch(formData: FormData): Promise<BatchAckResponse> {
  return extractEntitiesBatchAck(formData);
}
