export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function extractEntities(formData: FormData) {
  const r = await fetch("/api/extract", { method: "POST", body: formData });
  if (!r.ok) throw new Error("Error en extracción");
  return r.json();
}

export async function extractEntitiesBatch(formData: FormData) {
  const r = await fetch("/api/extract-batch", { method: "POST", body: formData });
  if (!r.ok) throw new Error("Error en extracción por lotes");
  return r.json();
}
