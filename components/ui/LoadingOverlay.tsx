"use client";

/**
 * LoadingOverlay()
 * Cubre una sección o toda la tarjeta con un velo de carga.
 * - Muestra un spinner y un texto accesible en español.
 * - No altera el layout al activarse (usa posicionamiento absoluto/fijo).
 * - Úsalo dentro de un contenedor con position: relative (por ejemplo, un Card) o en modo fullscreen.
 */
import React from "react";
import { Spin, Typography } from "antd";

type Props = {
  /** Controla la visibilidad del overlay. */
  show: boolean;
  /** Texto mostrado bajo el spinner (por defecto: "Procesando…"). */
  text?: string;
  /** Si true, cubre toda la ventana; si false, cubre el contenedor relativo. */
  fullscreen?: boolean;
};

const LoadingOverlay: React.FC<Props> = ({ show, text = "Procesando…", fullscreen = false }) => {
  if (!show) return null;

  const cls = fullscreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"
    : "absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm";

  return (
    <div className={cls} aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-2 rounded-md border border-slate-200/60 bg-white/90 p-4 shadow-sm">
        <Spin size="large" />
        <Typography.Text>{text}</Typography.Text>
      </div>
    </div>
  );
};

export default LoadingOverlay;
