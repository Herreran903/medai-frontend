import axios, { AxiosError } from "axios";

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

  const ax = err as AxiosError | undefined;
  if (ax && typeof ax === "object" && "isAxiosError" in (ax as any)) {
    const status = ax.response?.status;
    const data: any = ax.response?.data;
    const detail = extractDetail(data?.detail ?? data?.message ?? data);
    const msg = detail || ax.message || "Error de red";

    if ((ax as any).code === "ECONNABORTED") return "Tiempo de espera agotado";
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
  (res: any) => res,
  (error: unknown) => {
    const axErr = error as AxiosError;
    const status = axErr?.response?.status;
    const rawData: any = axErr?.response?.data;
    const detail = extractDetail(rawData?.detail ?? rawData?.message ?? rawData);

    let msg: string = detail || axErr?.message || "Error de red";
    let isNetwork = false;

    if ((axErr as any)?.code === "ECONNABORTED") {
      msg = "Tiempo de espera agotado";
    } else if (!status) {
      // CORS/servidor caído/offline
      msg = "No se pudo conectar con el servidor";
      isNetwork = true;
    } else {
      // Mensajes amigables por status cuando no hay detail claro
      if (status === 404 && !detail) msg = "Recurso no encontrado";
      if (status === 413) msg = "Archivo demasiado grande";
      if (status === 415) msg = "Tipo de archivo no soportado";
      if (status === 422 && !detail) msg = "Parámetros inválidos";
      if (status >= 500 && !detail) msg = "Error interno del servidor";
    }

    return Promise.reject(new ApiError(msg, { status, detail: rawData, isNetwork }));
  }
);
