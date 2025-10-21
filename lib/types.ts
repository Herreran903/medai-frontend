export type Code = {
  system: string;
  code: string;
  display?: string;
  score?: number;
  source?: string;
};

export type Entity = {
  type: string;
  text: string;
  start: number;
  end: number;
  score?: number;
  code?: string;
  codes?: Code[];
};

export type ExtractResponse = {
  text: string;
  entities: Entity[];
  meta: Record<string, unknown>;
};

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

export type BatchAckItem = {
  filename: string;
  id?: string | null;
  stored: boolean;
  entity_count?: number | null;
  url?: string | null;
  error?: string | null;
};

export type BatchAckResponse = {
  items: BatchAckItem[];
};
