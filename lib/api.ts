import { http } from "./http";
import { BatchAckResponse, ExtractAck, ExtractResponse } from "./types";

export async function extractEntitiesAck(formData: FormData): Promise<ExtractAck> {
  const { data } = await http.post<ExtractAck>("/extract", formData);
  return data;
}

export async function fetchNote(noteId: string): Promise<ExtractResponse> {
  const { data } = await http.get<ExtractResponse>(`/notes/${encodeURIComponent(noteId)}`);
  return data;
}

export async function extractEntitiesBatchAck(formData: FormData): Promise<BatchAckResponse> {
  const { data } = await http.post<BatchAckResponse>("/extract-batch", formData);
  return data;
}

export async function extractEntities(formData: FormData): Promise<ExtractAck> {
  return extractEntitiesAck(formData);
}

export async function extractEntitiesBatch(formData: FormData): Promise<BatchAckResponse> {
  return extractEntitiesBatchAck(formData);
}
