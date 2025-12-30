/** Canonical entity labels used for coloring and descriptions. */
export type BaseEntity =
  | "MODO"
  | "FIO2"
  | "PEEP"
  | "FR"
  | "VT"
  | "FLUJO"
  | "I_E"
  | "SENS"
  | "SAO2"
  | "PP"
  | "PMES"
  | "PM"
  | "EDAD"
  | "PESO"
  | "TALLA"
  | "TEMP"
  | "PA"
  | "PAS"
  | "PAD"
  | "PAM"
  | "FC"
  | "GLICEMIA"
  | "POSTURA"
  | "DX"
  | "PH"
  | "PACO2"
  | "HCO3"
  | "BE"
  | "PAO2"
  | "PAFI";

/** Lookup table for entity colors and descriptions. */
export const ENTITY_INFO: Record<BaseEntity, { color: `#${string}`; description: string }> = {
  // Configuración de ventilación
  MODO: {
    color: "#4f46e5",
    description: "Modo de operación (AC/VC, VC+, PC, SIMV, PSV, CPAP, etc.).",
  },
  FIO2: { color: "#8b5cf6", description: "Fracción inspirada de oxígeno." },
  PEEP: { color: "#a855f7", description: "PEEP (cmH₂O)." },
  FR: {
    color: "#f43f5e",
    description: "Frecuencia respiratoria (pueden ser 2 valores, ej. 14/20).",
  },
  VT: { color: "#d946ef", description: "Volumen tidal (pueden ser 2 valores, ej. 380/397)." },
  FLUJO: { color: "#06b6d4", description: "Flujo (L/min)." },
  I_E: { color: "#84cc16", description: "Relación inspiración:espiración (I:E)." },
  SENS: { color: "#a3e635", description: "Sensibilidad / Trigger." },

  // Respuesta a la ventilación
  SAO2: { color: "#38bdf8", description: "Saturación de oxígeno (SaO₂ %)." },
  PP: { color: "#60a5fa", description: "Presión pico (cmH₂O)." },
  PMES: { color: "#34d399", description: "Presión meseta (cmH₂O)." },
  PM: { color: "#10b981", description: "Poder mecánico." },

  // Antropométricos
  EDAD: { color: "#4f46e5", description: "Edad en años (solo número)." },
  PESO: { color: "#22c55e", description: "Peso (kg) (solo número)." },
  TALLA: { color: "#14b8a6", description: "Talla (m) (solo número)." },

  // Signos vitales
  TEMP: { color: "#f59e0b", description: "Temperatura corporal (°C)." },
  PA: { color: "#fb7185", description: "Presión arterial 120/80 (mmHg)." },
  PAS: { color: "#fda4af", description: "PA sistólica (mmHg)." },
  PAD: { color: "#fca5a5", description: "PA diastólica (mmHg)." },
  PAM: { color: "#ef4444", description: "Presión arterial media / TAM (mmHg)." },
  FC: { color: "#f97316", description: "Frecuencia cardiaca (lpm)." },
  GLICEMIA: { color: "#0ea5e9", description: "Glicemia / Glucometría (mg/dL)." },
  POSTURA: { color: "#64748b", description: "Postura o posicionamiento del paciente." },

  // Observaciones / Diagnósticos
  DX: { color: "#16a34a", description: "Diagnósticos / impresión diagnóstica." },

  // Gases arteriales
  PH: { color: "#14b8a6", description: "pH arterial." },
  PACO2: { color: "#0ea5e9", description: "PaCO₂ (mmHg)." },
  HCO3: { color: "#22d3ee", description: "HCO₃⁻ (mEq/L)." },
  BE: { color: "#34d399", description: "Base excess." },
  PAO2: { color: "#06b6d4", description: "PaO₂ (mmHg)." },
  PAFI: { color: "#8b5cf6", description: "PaFi (PaO₂/FiO₂)." },
};

/** Resolve the display color for a given entity label. */
export function getEntityColor(label: string): string {
  return label in ENTITY_INFO ? ENTITY_INFO[label as BaseEntity].color : "#999999";
}

/** Resolve the description for a given entity label. */
export function getEntityDescription(label: string): string | null {
  return label in ENTITY_INFO ? ENTITY_INFO[label as BaseEntity].description : null;
}
