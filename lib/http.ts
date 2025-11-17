import axios, { AxiosError, AxiosResponse } from "axios";

/**
 * ApiError — normaliza errores HTTP conservando status y detalle del backend.
 */
export class ApiError extends Error {
  status?: number;
  detail?: unknown;
  isNetwork?: boolean;

  constructor(
    message: string,
    opts: { status?: number; detail?: unknown; isNetwork?: boolean } = {}
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ApiError";
    this.status = opts.status;
    this.detail = opts.detail;
    this.isNetwork = opts.isNetwork;
  }
}

/**
 * Extrae un mensaje legible a partir de detail devuelto por FastAPI u otros backends.
 * Maneja:
 * - string
 * - array (p. ej. 422 Unprocessable Entity con [{loc,msg,type}])
 * - object genérico
 */
function extractDetail(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (d && typeof d === "object") {
          const obj = d as Record<string, unknown>;
          const loc = Array.isArray(obj.loc)
            ? (obj.loc as unknown[]).join(".")
            : ((obj.loc as string) ?? "");
          const msg = (obj.msg as string) ?? (obj.message as string) ?? "";
          return [loc, msg].filter(Boolean).join(": ");
        }
        return null;
      })
      .filter(Boolean) as string[];
    if (parts.length) return parts.join(" | ");
  }

  if (typeof detail === "object") {
    const obj = detail as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }

  return String(detail);
}

/**
 * toUserMessage(err) — convierte cualquier error a un mensaje amigable y localizado.
 * Úsalo en componentes para mostrar con AntD message/notification.
 */
export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const status = err.status;
    const message = err.message || "Error en la solicitud";
    if (!status) return message || "No se pudo conectar con el servidor";

    if (status === 400) return message || "Solicitud inválida";
    if (status === 401) return "No autorizado";
    if (status === 403) return "Acceso denegado";
    if (status === 404) return message || "Recurso no encontrado";
    if (status === 413) return "Archivo demasiado grande";
    if (status === 415) return "Tipo de archivo no soportado";
    if (status === 422) return message || "Parámetros inválidos";
    if (status >= 500) return "Error interno del servidor";
    return message || "Error en la solicitud";
  }

  const axErr = axios.isAxiosError(err) ? (err as AxiosError) : null;
  if (axErr) {
    const status = axErr.response?.status;
    const rawData = axErr.response?.data as unknown;

    let detail: string | null = null;
    if (rawData && typeof rawData === "object") {
      const obj = rawData as Record<string, unknown>;
      const maybeDetail = (obj as { detail?: unknown }).detail;
      const maybeMessage = (obj as { message?: unknown }).message;
      detail = extractDetail(maybeDetail ?? maybeMessage ?? rawData);
    } else {
      detail = extractDetail(rawData);
    }

    const msg = detail || axErr.message || "Error de red";

    if (axErr.code === "ECONNABORTED") return "Tiempo de espera agotado";
    if (!status) return "No se pudo conectar con el servidor";
    if (status === 404) return detail || "Recurso no encontrado";
    if (status === 413) return "Archivo demasiado grande";
    if (status === 415) return "Tipo de archivo no soportado";
    if (status === 422) return detail || "Parámetros inválidos";
    if (status >= 500) return "Error interno del servidor";
    return msg;
  }

  if (err instanceof Error) return err.message || "Error inesperado";
  if (typeof err === "string") return err;
  return "Error inesperado";
}

/**
 * Instancia de axios con baseURL configurable.
 */
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  timeout: 1200000,
  withCredentials: false,
});

/**
 * Interceptor de respuesta:
 * - Conforma un ApiError con status y detail.
 * - Normaliza mensajes para casos comunes (timeout, 4xx/5xx, red).
 */
http.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: unknown) => {
    const axErr = error as AxiosError;
    const status = axErr?.response?.status;
    const rawData = axErr?.response?.data as unknown;

    let extractedDetail: string | null = null;
    if (rawData && typeof rawData === "object") {
      const obj = rawData as Record<string, unknown>;
      const maybeDetail = (obj as { detail?: unknown }).detail;
      const maybeMessage = (obj as { message?: unknown }).message;
      extractedDetail = extractDetail(maybeDetail ?? maybeMessage ?? rawData);
    } else {
      extractedDetail = extractDetail(rawData);
    }

    let msg: string = extractedDetail || axErr?.message || "Error de red";
    let isNetwork = false;

    if (axErr.code === "ECONNABORTED") {
      msg = "Tiempo de espera agotado";
    } else if (!status) {
      // CORS/servidor caído/offline
      msg = "No se pudo conectar con el servidor";
      isNetwork = true;
    } else {
      // Mensajes amigables por status cuando no hay detail claro
      if (status === 404 && !extractedDetail) msg = "Recurso no encontrado";
      if (status === 413) msg = "Archivo demasiado grande";
      if (status === 415) msg = "Tipo de archivo no soportado";
      if (status === 422 && !extractedDetail) msg = "Parámetros inválidos";
      if (status >= 500 && !extractedDetail) msg = "Error interno del servidor";
    }

    return Promise.reject(new ApiError(msg, { status, detail: rawData, isNetwork }));
  }
);
