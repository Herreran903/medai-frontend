"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Spin, Typography } from "antd";

/** Props for the loading overlay portal. */
export type LoadingOverlayProps = {
  show: boolean;
  /** Optional text shown under the spinner. */
  text?: string;
};

/** Full-screen loading overlay rendered as a portal into `document.body`. */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, text = "Procesando…" }) => {
  if (!show || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-2 rounded-md p-4">
        <Spin size="large" />
        <Typography.Text>{text}</Typography.Text>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
