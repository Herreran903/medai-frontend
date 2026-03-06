"use client";

import { Alert } from "antd";

type LlmPrivacyAlertProps = {
  className?: string;
};

export default function LlmPrivacyAlert({ className }: LlmPrivacyAlertProps) {
  return (
    <Alert
      className={className}
      type="warning"
      showIcon
      message="LLM usa GPT, un modelo publico."
      description="Evita ingresar informacion personal sensible o datos que permitan identificar a una persona. Anonimiza nombres, documentos, telefonos, correos, direcciones y cualquier otro dato personal antes de procesar la nota."
    />
  );
}
