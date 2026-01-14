/**
 * Clinical entity type definitions and UI configuration for MedAI.
 *
 * This module defines the canonical entity labels recognized by the MedAI NER
 * model, along with their associated UI colors and clinical descriptions. These
 * constants ensure consistent visual representation and semantic meaning across
 * all components that display extracted entities.
 *
 * @remarks
 * The entity types are specific to the MedAI clinical domain, focusing on:
 * - Mechanical ventilation parameters and monitoring values
 * - Patient anthropometric measurements
 * - Vital signs and hemodynamic parameters
 * - Arterial blood gas analysis results
 * - Clinical diagnoses and observations
 *
 * Entity labels are preserved in their original Spanish abbreviations (e.g., "MODO",
 * "PESO") to maintain consistency with the Backend API and clinical documentation
 * conventions in Spanish-speaking healthcare settings.
 *
 * @example
 * ```typescript
 * import { getEntityColor, getEntityDescription, BaseEntity } from "@/constants/entities";
 *
 * // Get color for entity highlighting
 * const color = getEntityColor("FIO2"); // "#8b5cf6"
 *
 * // Get description for tooltips
 * const desc = getEntityDescription("PEEP"); // "Positive End-Expiratory Pressure (cmH₂O)."
 *
 * // Type-safe entity handling
 * const entityType: BaseEntity = "SAO2";
 * ```
 *
 * @module entities
 */

/**
 * Union type of all canonical entity labels emitted by the Backend API.
 *
 * These labels represent the clinical entity categories recognized by the MedAI
 * NER model. Each label corresponds to a specific type of clinical measurement,
 * parameter, or observation extracted from clinical notes.
 *
 * @remarks
 * The labels are organized into logical groups:
 *
 * **Ventilation Configuration:**
 * - `MODO` — Ventilation mode
 * - `FIO2` — Fraction of inspired oxygen
 * - `PEEP` — Positive end-expiratory pressure
 * - `FR` — Respiratory rate
 * - `VT` — Tidal volume
 * - `FLUJO` — Flow rate
 * - `I_E` — Inspiration:expiration ratio
 * - `SENS` — Trigger sensitivity
 *
 * **Ventilation Monitoring:**
 * - `SAO2` — Oxygen saturation
 * - `PP` — Peak pressure
 * - `PMES` — Plateau pressure
 * - `PM` — Mechanical power
 *
 * **Anthropometrics:**
 * - `EDAD` — Age
 * - `PESO` — Weight
 * - `TALLA` — Height
 *
 * **Vital Signs:**
 * - `TEMP` — Temperature
 * - `PA` — Blood pressure (combined)
 * - `PAS` — Systolic blood pressure
 * - `PAD` — Diastolic blood pressure
 * - `PAM` — Mean arterial pressure
 * - `FC` — Heart rate
 * - `GLICEMIA` — Blood glucose
 * - `POSTURA` — Patient positioning
 *
 * **Clinical:**
 * - `DX` — Diagnosis
 *
 * **Arterial Blood Gas:**
 * - `PH` — Arterial pH
 * - `PACO2` — Partial pressure of CO₂
 * - `HCO3` — Bicarbonate
 * - `BE` — Base excess
 * - `PAO2` — Partial pressure of O₂
 * - `PAFI` — PaO₂/FiO₂ ratio
 */
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

/**
 * UI configuration mapping for entity types.
 *
 * This record provides the visual styling (color) and clinical description for
 * each entity type. Use this mapping to ensure consistent rendering of entity
 * highlights, badges, legends, and tooltips throughout the application.
 *
 * @remarks
 * Colors are selected to:
 * - Provide sufficient contrast for accessibility
 * - Group related entity types with similar hues
 * - Distinguish between different clinical categories
 *
 * Descriptions are written for healthcare professionals and assume familiarity
 * with clinical terminology and abbreviations.
 *
 * @example
 * ```typescript
 * // Access entity configuration directly
 * const fio2Config = ENTITY_INFO.FIO2;
 * console.log(fio2Config.color); // "#8b5cf6"
 * console.log(fio2Config.description); // "Fraction of inspired oxygen (FiO₂)."
 *
 * // Iterate over all entities for legend generation
 * Object.entries(ENTITY_INFO).forEach(([label, { color, description }]) => {
 *   console.log(`${label}: ${description} (${color})`);
 * });
 * ```
 */
export const ENTITY_INFO: Record<BaseEntity, { color: `#${string}`; description: string }> = {
  /* ─────────────────────────────────────────────────────────────────────────
   * Ventilation Configuration Parameters
   * Parameters set by clinicians to configure mechanical ventilation.
   * ───────────────────────────────────────────────────────────────────────── */

  /**
   * Ventilation mode configuration.
   * Identifies the operational mode of mechanical ventilation.
   */
  MODO: {
    color: "#4f46e5",
    description: "Modo de ventilacion (AC/VC, VC+, PC, SIMV, PSV, CPAP, etc.).",
  },

  /**
   * Fraction of inspired oxygen.
   * The concentration of oxygen delivered to the patient.
   */
  FIO2: {
    color: "#8b5cf6",
    description: "Fraccion inspirada de oxigeno (FiO₂).",
  },

  /**
   * Positive end-expiratory pressure.
   * Pressure maintained in the airways at the end of expiration.
   */
  PEEP: {
    color: "#a855f7",
    description: "Presion positiva al final de la espiracion (cmH₂O).",
  },

  /**
   * Respiratory rate.
   * May include two values (set/actual), e.g., 14/20.
   */
  FR: {
    color: "#f43f5e",
    description: "Frecuencia respiratoria (puede incluir programado/real, p. ej., 14/20).",
  },

  /**
   * Tidal volume.
   * Volume of air delivered per breath; may include two values.
   */
  VT: {
    color: "#d946ef",
    description: "Volumen tidal (puede incluir programado/real, p. ej., 380/397 mL).",
  },

  /**
   * Inspiratory flow rate.
   * The rate at which gas is delivered during inspiration.
   */
  FLUJO: {
    color: "#06b6d4",
    description: "Flujo inspiratorio (L/min).",
  },

  /**
   * Inspiration to expiration ratio.
   * The time ratio between inspiratory and expiratory phases.
   */
  I_E: {
    color: "#84cc16",
    description: "Relacion inspiracion:espiracion (I:E).",
  },

  /**
   * Trigger sensitivity.
   * The threshold for patient-initiated breaths.
   */
  SENS: {
    color: "#a3e635",
    description: "Sensibilidad del disparo / trigger inspiratorio.",
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * Ventilation Response and Monitoring Signals
   * Values measured from the patient during mechanical ventilation.
   * ───────────────────────────────────────────────────────────────────────── */

  /**
   * Oxygen saturation.
   * Percentage of hemoglobin saturated with oxygen.
   */
  SAO2: {
    color: "#38bdf8",
    description: "Saturacion de oxigeno (SaO₂/SpO₂ %).",
  },

  /**
   * Peak inspiratory pressure.
   * Maximum pressure reached during inspiration.
   */
  PP: {
    color: "#60a5fa",
    description: "Presion inspiratoria pico (cmH₂O).",
  },

  /**
   * Plateau pressure.
   * Pressure measured during an inspiratory hold.
   */
  PMES: {
    color: "#34d399",
    description: "Presion de meseta (cmH₂O).",
  },

  /**
   * Mechanical power.
   * Energy transferred to the respiratory system per unit time.
   */
  PM: {
    color: "#10b981",
    description: "Potencia mecanica (J/min).",
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * Anthropometric Values
   * Patient demographic and physical measurements.
   * ───────────────────────────────────────────────────────────────────────── */

  /**
   * Patient age.
   * Age in years (numeric value only).
   */
  EDAD: {
    color: "#4f46e5",
    description: "Edad del paciente (anios).",
  },

  /**
   * Patient weight.
   * Body weight in kilograms (numeric value only).
   */
  PESO: {
    color: "#22c55e",
    description: "Peso del paciente (kg).",
  },

  /**
   * Patient height.
   * Body height in meters (numeric value only).
   */
  TALLA: {
    color: "#14b8a6",
    description: "Talla del paciente (m).",
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * Vital Signs
   * Core physiological measurements indicating patient status.
   * ───────────────────────────────────────────────────────────────────────── */

  /**
   * Body temperature.
   * Core or peripheral temperature measurement.
   */
  TEMP: {
    color: "#f59e0b",
    description: "Temperatura corporal (°C).",
  },

  /**
   * Blood pressure (combined).
   * Systolic/diastolic format, e.g., 120/80 mmHg.
   */
  PA: {
    color: "#fb7185",
    description: "Presion arterial, sistolica/diastolica (mmHg).",
  },

  /**
   * Systolic blood pressure.
   * Peak arterial pressure during cardiac contraction.
   */
  PAS: {
    color: "#fda4af",
    description: "Presion arterial sistolica (mmHg).",
  },

  /**
   * Diastolic blood pressure.
   * Minimum arterial pressure during cardiac relaxation.
   */
  PAD: {
    color: "#fca5a5",
    description: "Presion arterial diastolica (mmHg).",
  },

  /**
   * Mean arterial pressure.
   * Average arterial pressure during a cardiac cycle.
   */
  PAM: {
    color: "#ef4444",
    description: "Presion arterial media / PAM (mmHg).",
  },

  /**
   * Heart rate.
   * Number of cardiac contractions per minute.
   */
  FC: {
    color: "#f97316",
    description: "Frecuencia cardiaca (bpm).",
  },

  /**
   * Blood glucose level.
   * Serum or capillary glucose concentration.
   */
  GLICEMIA: {
    color: "#0ea5e9",
    description: "Glucemia / glucometria (mg/dL).",
  },

  /**
   * Patient positioning.
   * Body position or posture during care.
   */
  POSTURA: {
    color: "#64748b",
    description: "Posicion del paciente / postura corporal.",
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * Observations and Diagnoses
   * Clinical assessments and diagnostic impressions.
   * ───────────────────────────────────────────────────────────────────────── */

  /**
   * Diagnosis.
   * Clinical diagnoses or diagnostic impressions.
   */
  DX: {
    color: "#16a34a",
    description: "Diagnostico / impresion diagnostica.",
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * Arterial Blood Gas Values
   * Parameters from arterial blood gas analysis.
   * ───────────────────────────────────────────────────────────────────────── */

  /**
   * Arterial pH.
   * Hydrogen ion concentration in arterial blood.
   */
  PH: {
    color: "#14b8a6",
    description: "pH arterial.",
  },

  /**
   * Partial pressure of carbon dioxide.
   * CO₂ tension in arterial blood.
   */
  PACO2: {
    color: "#0ea5e9",
    description: "Presion parcial de CO₂ (PaCO₂, mmHg).",
  },

  /**
   * Bicarbonate concentration.
   * Serum bicarbonate level.
   */
  HCO3: {
    color: "#22d3ee",
    description: "Bicarbonato (HCO₃⁻, mEq/L).",
  },

  /**
   * Base excess.
   * Deviation from normal buffer base.
   */
  BE: {
    color: "#34d399",
    description: "Exceso de base (BE, mEq/L).",
  },

  /**
   * Partial pressure of oxygen.
   * O₂ tension in arterial blood.
   */
  PAO2: {
    color: "#06b6d4",
    description: "Presion parcial de O₂ (PaO₂, mmHg).",
  },

  /**
   * PaO₂/FiO₂ ratio.
   * Index of oxygenation efficiency; used for ARDS classification.
   */
  PAFI: {
    color: "#8b5cf6",
    description: "Relacion PaO₂/FiO₂ (relacion P/F).",
  },
};

/**
 * Resolves the UI color for a given entity label.
 *
 * Returns the configured hex color for known entity types, or a neutral gray
 * fallback for unrecognized labels. Use this function when rendering entity
 * highlights, badges, or any visual element that needs color-coding by type.
 *
 * @param label - The entity type label to look up.
 * @returns A hex color string (e.g., "#4f46e5") for the entity type,
 *          or "#999999" for unrecognized labels.
 *
 * @example
 * ```typescript
 * // In a React component
 * const EntityBadge = ({ entity }: { entity: Entity }) => (
 *   <span style={{ backgroundColor: getEntityColor(entity.type) }}>
 *     {entity.text}
 *   </span>
 * );
 * ```
 */
export function getEntityColor(label: string): string {
  return label in ENTITY_INFO ? ENTITY_INFO[label as BaseEntity].color : "#999999";
}

/**
 * Resolves the clinical description for a given entity label.
 *
 * Returns the human-readable description for known entity types, suitable for
 * display in tooltips, legends, and help text. Returns null for unrecognized
 * labels to allow callers to handle unknown types appropriately.
 *
 * @param label - The entity type label to look up.
 * @returns The clinical description string for known entity types,
 *          or null for unrecognized labels.
 *
 * @example
 * ```typescript
 * // In a tooltip component
 * const EntityTooltip = ({ type }: { type: string }) => {
 *   const description = getEntityDescription(type);
 *   return description ? (
 *     <Tooltip content={description}>
 *       <InfoIcon />
 *     </Tooltip>
 *   ) : null;
 * };
 * ```
 */
export function getEntityDescription(label: string): string | null {
  return label in ENTITY_INFO ? ENTITY_INFO[label as BaseEntity].description : null;
}
