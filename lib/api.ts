import { http } from "./http";

export async function extractEntities(formData: FormData) {
  const { data } = await http.post("/extract", formData);
  return data;
}

export async function extractEntitiesBatch(formData: FormData) {
  const { data } = await http.post("/extract-batch", formData);
  return data;
}
