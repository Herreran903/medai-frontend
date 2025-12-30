"use client";

/**
 * Helper de notificaciones estandarizado para toda la app.
 * - Unifica textos en español y duraciones coherentes.
 * - Usa message de Ant Design (ligero, accesible y consistente).
 * - Proporciona funciones: info, success, error y loading.
 * - loading() retorna una función para cerrar manualmente cuando finalice.
 */

import { message } from "antd";

/** Function that closes a persistent notification. */
export type CerrarFn = () => void;

/** Muestra un mensaje informativo (~3s). */
function info(texto: string, duracion = 3): void {
  message.open({
    type: "info",
    content: texto,
    duration: duracion,
  });
}

/** Muestra un mensaje de éxito (~3s). */
function success(texto: string, duracion = 3): void {
  message.open({
    type: "success",
    content: texto,
    duration: duracion,
  });
}

/** Muestra un mensaje de error (~5s). */
function error(texto: string, duracion = 5): void {
  message.open({
    type: "error",
    content: texto,
    duration: duracion,
  });
}

/**
 * Muestra un estado de carga persistente (hasta cerrar manualmente).
 * Retorna una función para cerrar el mensaje cuando finalice.
 */
function loading(texto = "Procesando…"): CerrarFn {
  const key = "global-loading";
  message.open({
    key,
    type: "loading",
    content: texto,
    duration: 0,
  });
  return () => message.destroy(key);
}

/** Shared notification helper with info/success/error/loading shortcuts. */
export const notify = { info, success, error, loading };
/** Type helper for the notify API. */
export type Notifier = typeof notify;
