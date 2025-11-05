# MedAI Extraction API Contract (Frontend ↔ Backend)

This document defines the request and response contracts used by the frontend when calling the extraction endpoints. It is the source of truth to align backend expectations.

## Conventions
- All requests are multipart/form-data built with FormData.
- Booleans are sent as string values "true"/"false".
- CSV fields are comma-separated with no spaces.
- File arrays are sent by repeating the same field name for each file.

## Locked normalization config (frontend)
- systems_csv: RXNORM,SNOMEDCT_US,ICD10CM
- restrict_types_csv: DX

These values are not user-editable in the UI and are always enforced in the provider.

## Types returned (summary)
See [lib/types.ts](lib/types.ts) for exact TypeScript types mirrored from backend pydantic schemas:
- ExtractAck
- BatchAckItem
- BatchAckResponse

---

## Endpoint: POST /extract

Request (FormData):
- text?: string (mutually exclusive with file)
- file?: File (mutually exclusive with text)
- model: string
- normalize?: "true" | "false"
- systems_csv?: string (CSV of SABs; defaults to locked list)
- restrict_types_csv?: string (CSV of entity types; defaults to locked list)
- min_link_score?: string (optional; numeric in [0,1] stringified)
- max_candidates?: string (optional; integer stringified)

Response: ExtractAck (JSON)
- id: string
- stored: boolean
- url?: string | null
- filename?: string | null
- episode_id?: string | null
- note_date?: string | null
- entity_count?: number | null
- result?: ExtractResponse | null

Notes:
- Frontend source where the request is built: [components/upload/single-upload.tsx](components/upload/single-upload.tsx)

---

## Endpoint: POST /extract-batch

Request (FormData):
- files: File[] (repeat key "files" per file)
- model: string
- save?: "true" | "false" (frontend sends "true" explicitly)
- normalize?: "true" | "false"
- systems_csv?: string (CSV of SABs; frontend sends locked defaults)
- restrict_types_csv?: string (CSV of types; frontend sends locked defaults)
- notes_meta: string (JSON.stringify([{ filename, episode_id, note_date }]))
  - episode_id: string (required per file)
  - note_date: ISO string (required per file)

Response: BatchAckResponse (JSON)
{
  items: Array<{
    filename: string;
    id?: string | null;
    stored: boolean;
    entity_count?: number | null;
    url?: string | null;
    error?: string | null;
  }>
}

Notes:
- UI enforces episode_id and note_date per file; the frontend will not submit without them.
- When id is present in an item, the UI renders a link to /results/{id} so the user can view entities.
- Frontend source where the request is built: [components/upload/batch-upload.tsx](components/upload/batch-upload.tsx)

---

## cURL examples

Single file extraction (/extract):

curl -X POST http://localhost:8000/extract \
  -H "Accept: application/json" \
  -F "file=@/path/to/note.txt" \
  -F "model=transformer" \
  -F "normalize=true" \
  -F "systems_csv=RXNORM,SNOMEDCT_US,ICD10CM" \
  -F "restrict_types_csv=DX" \
  -F "min_link_score=0.6" \
  -F "max_candidates=25"

Batch extraction (/extract-batch):

curl -X POST http://localhost:8000/extract-batch \
  -H "Accept: application/json" \
  -F "files=@/path/a.txt" \
  -F "files=@/path/b.txt" \
  -F "model=transformer" \
  -F "save=true" \
  -F "normalize=false" \
  -F "systems_csv=RXNORM,SNOMEDCT_US,ICD10CM" \
  -F "restrict_types_csv=DX" \
  -F 'notes_meta=[{"filename":"a.txt","episode_id":"E-1001","note_date":"2025-01-01T10:00:00Z"},{"filename":"b.txt","episode_id":"E-1001","note_date":"2025-01-01T10:05:00Z"}]'

---

## Frontend references
- Batch UI and request: [components/upload/batch-upload.tsx](components/upload/batch-upload.tsx)
- Single UI and request: [components/upload/single-upload.tsx](components/upload/single-upload.tsx)
- Settings provider (locks SABs/types): [components/providers/model-settings-provider.tsx](components/providers/model-settings-provider.tsx)
- TS result types: [lib/types.ts](lib/types.ts)
- API client helpers: [lib/api.ts](lib/api.ts)

## Field dictionary
- model: string; supports "transformer" | "lstm" | "llm"
- normalize: boolean sent as "true"/"false"
- systems_csv: CSV of SABs; default RXNORM,SNOMEDCT_US,ICD10CM
- restrict_types_csv: CSV of entity types; default DX
- min_link_score: number in [0,1] stringified (single endpoint only)
- max_candidates: number stringified (single endpoint only)
- files: array of files, repeating key
- file: single file (single endpoint)
- text: raw text (single endpoint)

## Response dictionary
- ExtractAck: see [lib/types.ts](lib/types.ts); contains id, stored, url, entity_count, result
- BatchAckResponse: items[] of BatchAckItem with filename, stored, id, url, entity_count, error

## Backend parsing helpers (reference)
- Backend converts systems_csv and restrict_types_csv to lists using its own parser.
- Backend default_model will be used if model is empty.
- Backend save_results policy controls whether results are persisted when save=true.