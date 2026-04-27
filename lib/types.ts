/**
 * Tipos compartidos entre el frontend y el gateway de MedAI.
 *
 * Este archivo refleja el contrato actual expuesto por
 * `medai-backend/app/schemas.py`.
 */

/**
 * Entidad clínica extraída desde una nota.
 *
 * `start` y `end` pueden venir nulos u omitidos en el contrato del backend,
 * aunque los modelos finales normalmente devuelven offsets completos.
 */
export type Entity = {
  type: string;
  text: string;
  code?: string | null;
  start?: number | null;
  end?: number | null;
};

/**
 * Resultado completo de extracción para una nota.
 */
export type ExtractResponse = {
  text: string;
  entities: Entity[];
  meta: Record<string, unknown>;
};

/**
 * Acuse de recibo para extracción individual.
 */
export type ExtractAck = {
  id: string;
  stored: boolean;
  url?: string | null;
  filename?: string | null;
  episode_id?: string | null;
  note_date?: string | null;
  entity_count?: number | null;
  result?: ExtractResponse | null;
};

/**
 * Estado de un archivo dentro de una extracción por lote.
 */
export type BatchAckItem = {
  filename: string;
  id?: string | null;
  stored: boolean;
  entity_count?: number | null;
  url?: string | null;
  error?: string | null;
};

/**
 * Respuesta del endpoint de extracción por lote.
 */
export type BatchAckResponse = {
  items: BatchAckItem[];
};
