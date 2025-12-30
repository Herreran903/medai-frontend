/** Terminology code attached to an extracted entity. */
export type Code = {
  system: string;
  code: string;
  display?: string;
  score?: number;
  source?: string;
};

/** Entity extracted from clinical text. */
export type Entity = {
  type: string;
  text: string;
  start: number;
  end: number;
  score?: number;
  code?: string;
  codes?: Code[];
};

/** Full extraction response payload with entities and metadata. */
export type ExtractResponse = {
  text: string;
  entities: Entity[];
  meta: Record<string, unknown>;
};

/** Acknowledgement for an extraction request, with optional inline result. */
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

/** Item-level status for a batch extraction request. */
export type BatchAckItem = {
  filename: string;
  id?: string | null;
  stored: boolean;
  entity_count?: number | null;
  url?: string | null;
  error?: string | null;
};

/** Response for batch extraction, containing item-level acknowledgements. */
export type BatchAckResponse = {
  items: BatchAckItem[];
};
