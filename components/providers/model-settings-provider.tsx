"use client";

/**
 * Model settings context provider for the MedAI frontend.
 *
 * This module provides a React Context-based state management solution for
 * extraction model configuration. It serves as the single source of truth for
 * model selection, variant configuration, and normalization parameters across
 * all extraction workflows in the application.
 *
 * @remarks
 * **Architectural Role:**
 * The provider enforces business rules that ensure UI selections remain compatible
 * with Backend API expectations. Certain fields (vocabulary systems and entity types
 * for normalization) are locked to prevent configuration drift between frontend and
 * backend.
 *
 * **Key Features:**
 * - Centralized model configuration state
 * - Automatic variant coercion when switching model families
 * - Locked fields that cannot be modified by UI components
 * - Type-safe settings with full TypeScript support
 *
 * @example
 * ```tsx
 * // In app layout
 * import { ModelSettingsProvider } from "@/components/providers";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <ModelSettingsProvider>
 *       {children}
 *     </ModelSettingsProvider>
 *   );
 * }
 *
 * // In a component
 * import { useModelSettings } from "@/components/providers";
 *
 * function ModelSelector() {
 *   const { settings, setSettings } = useModelSettings();
 *
 *   const handleModelChange = (model: ModelKind) => {
 *     setSettings({ ...settings, model });
 *   };
 *
 *   return <Select value={settings.model} onChange={handleModelChange} />;
 * }
 * ```
 *
 * @module model-settings-provider
 */

import React, { createContext, useContext, useState } from "react";

/**
 * Locked normalization vocabulary systems (SABs) required by the Backend API.
 *
 * These vocabulary identifiers correspond to UMLS source abbreviations and are
 * enforced by the provider to ensure the UI cannot diverge from backend expectations.
 * Any attempt to modify these values through `setSettings` will be overwritten.
 *
 * @remarks
 * The locked vocabularies are:
 * - `RXNORM` — Drug names, ingredients, and clinical drug forms
 * - `SNOMEDCT_US` — Clinical terms covering diseases, findings, and procedures
 * - `ICD10CM` — Diagnosis codes for billing and classification
 *
 * These systems were selected based on clinical utility and backend normalization
 * service capabilities.
 */
// Normalizacion deshabilitada temporalmente; se dejan constantes como referencia.
// export const LOCKED_SABS = ["RXNORM", "SNOMEDCT_US", "ICD10CM"] as const;

/**
 * Locked entity types eligible for normalization.
 *
 * Only entities of these types will be sent to the normalization service.
 * This restriction ensures normalization resources are focused on entity
 * types where vocabulary mapping provides clinical value.
 *
 * @remarks
 * Currently limited to `DX` (diagnosis) entities, as these benefit most from
 * standardized coding for interoperability and analytics purposes.
 */
// export const LOCKED_ENTITY_TYPES = ["DX"] as const;

/**
 * Supported extraction model families exposed in the UI.
 *
 * Each model family represents a different NER architecture with distinct
 * performance characteristics and resource requirements:
 *
 * - `transformer` — BERT-based models (BETO, RoBERTa) with high accuracy
 * - `lstm` — Recurrent neural network models with lower resource requirements
 * - `llm` — Large language model-based extraction (Claude, GPT, local models)
 *
 * @remarks
 * The model family selection affects which variants are available and how
 * the extraction request is processed by the Backend API.
 */
export type ModelKind = "transformer" | "lstm" | "llm";

/**
 * Available variants for LLM-based extraction models.
 *
 * These variants correspond to different large language model providers
 * or deployment configurations supported by the Backend API.
 *
 * - `claude` — Anthropic Claude models
 * - `gpt` — OpenAI GPT models
 * - `local` — Locally deployed open-source LLMs
 */
export const LLM_VARIANTS = ["claude", "gpt", "local"] as const;

/**
 * Available variants for transformer-based extraction models.
 *
 * These variants correspond to different pre-trained transformer architectures
 * fine-tuned for clinical NER in Spanish medical text.
 *
 * - `beto` — BETO (Spanish BERT) fine-tuned for clinical NER
 * - `roberta` — RoBERTa-based model for clinical entity extraction
 */
export const TRANSFORMER_VARIANTS = ["beto", "roberta"] as const;

/**
 * Type representing valid LLM variant values.
 * Derived from the {@link LLM_VARIANTS} constant array.
 */
export type LlmVariant = (typeof LLM_VARIANTS)[number];

/**
 * Type representing valid transformer variant values.
 * Derived from the {@link TRANSFORMER_VARIANTS} constant array.
 */
export type TransformerVariant = (typeof TRANSFORMER_VARIANTS)[number];

/**
 * Resolves the default variant for a given model family.
 *
 * This function provides the enforced default variant for each model family.
 * Variants are currently not user-configurable in the UI.
 *
 * @param model - The model family to get the default variant for.
 * @returns The default variant string, or null for models without variants.
 *
 * @internal
 */
function defaultVariantForModel(model: ModelKind): string | null {
  switch (model) {
    case "llm":
      return "gpt";
    case "transformer":
      return "roberta";
    case "lstm":
    default:
      /* LSTM models do not expose configurable variants. */
      return null;
  }
}

/**
 * Coerces a variant value to be valid for the specified model family.
 *
 * Variants are currently fixed per family, so this function ignores the input
 * variant and returns the enforced default for the selected model family.
 *
 * @param model - The target model family.
 * @param variant - The current variant value to coerce.
 * @returns A valid variant for the model family, or null for LSTM.
 *
 * @internal
 */
function coerceVariant(model: ModelKind, _variant: string | null | undefined): string | null {
  /*
   * Variants are currently not user-configurable in the UI.
   * We enforce a single backend variant per model family:
   * - transformer -> roberta
   * - llm -> gpt
   * - lstm -> null
   */
  void _variant;
  if (model === "lstm") return null;
  return defaultVariantForModel(model);
}

/**
 * Global extraction model settings shared across the application.
 *
 * This type defines the complete configuration state for entity extraction
 * requests. These values are used to build the FormData payload sent to
 * the Backend API extraction endpoints.
 *
 * @remarks
 * The `systems` and `restrict_types` fields are enforced to locked defaults
 * on every update through `setSettings`. This ensures the UI cannot accidentally
 * or intentionally diverge from backend expectations for normalization behavior.
 *
 * @example
 * ```typescript
 * const settings: ModelSettings = {
 *   model: "transformer",
 *   model_variant: "roberta",
 *   normalize: true,
 *   systems: ["RXNORM", "SNOMEDCT_US", "ICD10CM"],
 *   restrict_types: ["DX"],
 *   min_link_score: 0.6,
 *   max_candidates: 25
 * };
 * ```
 */
export type ModelSettings = {
  /**
   * Model family used by the extraction pipeline.
   *
   * Determines which NER architecture processes the clinical text.
   * Each family has different accuracy, speed, and resource characteristics.
   */
  model: ModelKind;

  /**
   * Optional model variant within the selected family.
   *
   * Specifies which specific model implementation to use. The available
   * variants depend on the selected model family. Null for LSTM models
   * which do not have configurable variants.
   */
  model_variant: string | null;

  // Normalizacion deshabilitada temporalmente; se deja documentacion como referencia.
  // /**
  //  * Enables UMLS-based normalization for extracted entities.
  //  *
  //  * When true, extracted entities are linked to standardized medical
  //  * vocabulary codes (SNOMED CT, RxNorm, ICD-10). This enables
  //  * interoperability with EHR systems and clinical analytics.
  //  */
  // normalize: boolean;
  //
  // /**
  //  * Target vocabulary systems (SABs) for normalization.
  //  *
  //  * @remarks
  //  * This field is locked to {@link LOCKED_SABS} and cannot be modified
  //  * through the UI. Any values set will be overwritten by the provider.
  //  */
  // systems: string[];
  //
  // /**
  //  * Entity types eligible for normalization.
  //  *
  //  * @remarks
  //  * This field is locked to {@link LOCKED_ENTITY_TYPES} and cannot be
  //  * modified through the UI. Only diagnosis entities are normalized.
  //  */
  // restrict_types: string[];
  //
  // /**
  //  * Minimum similarity score required to accept a linked code.
  //  *
  //  * Codes with similarity scores below this threshold are filtered out
  //  * from normalization results. Higher values increase precision but
  //  * may reduce recall for ambiguous terms.
  //  *
  //  * @remarks
  //  * Valid range is 0.0 to 1.0. Recommended values are 0.5-0.8 depending
  //  * on the desired precision/recall tradeoff.
  //  */
  // min_link_score: number;
  //
  // /**
  //  * Maximum candidate CUIs considered per entity during normalization.
  //  *
  //  * Limits the number of concept candidates evaluated for each entity,
  //  * affecting both performance and result completeness. Higher values
  //  * may find better matches but increase processing time.
  //  */
  // max_candidates: number;
};

/**
 * Default settings applied on initial load and reset operations.
 *
 * These values are chosen to match backend defaults and provide a sensible
 * starting configuration for clinical entity extraction workflows.
 *
 * @remarks
 * The defaults prioritize:
 * - Transformer models for accuracy
 * - RoBERTa variant for transformer
 * - Normalization disabled by default (opt-in)
 * - Conservative linking thresholds for precision
 */
export const DEFAULTS: ModelSettings = {
  model: "transformer",
  model_variant: defaultVariantForModel("transformer"),
  // Normalizacion deshabilitada temporalmente; se dejan defaults como referencia.
  // normalize: false,
  // /* Use copies to avoid accidental external mutation. */
  // systems: [...LOCKED_SABS],
  // restrict_types: [...LOCKED_ENTITY_TYPES],
  // min_link_score: 0.6,
  // max_candidates: 25,
};

/**
 * Context value type for the model settings provider.
 * @internal
 */
type ModelSettingsContextValue = {
  /** Current model settings state. */
  settings: ModelSettings;
  /**
   * Updates settings while enforcing locked fields and variant coercion.
   * Use this instead of setting state directly in components.
   */
  setSettings: (s: ModelSettings) => void;
};

/**
 * React Context for model settings.
 * @internal
 */
const Ctx = createContext<ModelSettingsContextValue>({
  settings: DEFAULTS,
  setSettings: () => {},
});

/**
 * Props for the ModelSettingsProvider component.
 */
type ModelSettingsProviderProps = {
  /** Child components that will have access to the settings context. */
  children: React.ReactNode;
};

/**
 * Context provider for global extraction model settings.
 *
 * This component serves as the single source of truth for model configuration
 * across the MedAI frontend. It manages state for model selection, variant
 * configuration, and normalization parameters while enforcing business rules
 * that ensure compatibility with the Backend API.
 *
 * @remarks
 * **Enforcement Behavior:**
 * - The `systems` field is always reset to {@link LOCKED_SABS}
 * - The `restrict_types` field is always reset to {@link LOCKED_ENTITY_TYPES}
 * - The `model_variant` is coerced to a valid value for the selected model family
 *
 * **Placement:**
 * This provider should be placed near the root of the application, typically
 * in the app layout, to ensure all extraction-related components have access
 * to the settings context.
 *
 * @param props - Component props containing children to render.
 * @returns A context provider wrapping the children.
 *
 * @example
 * ```tsx
 * // In app/(app)/layout.tsx
 * import { ModelSettingsProvider } from "@/components/providers";
 *
 * export default function AppLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <ModelSettingsProvider>
 *       <Header />
 *       <main>{children}</main>
 *     </ModelSettingsProvider>
 *   );
 * }
 * ```
 */
export const ModelSettingsProvider: React.FC<ModelSettingsProviderProps> = ({ children }) => {
  const [settings, setState] = useState<ModelSettings>(DEFAULTS);

  // /**
  //  * Enforces locked fields by overwriting with constant values.
  //  * @internal
  //  */
  // const enforceLocked = (s: ModelSettings): ModelSettings => ({
  //   ...s,
  //   systems: [...LOCKED_SABS],
  //   restrict_types: [...LOCKED_ENTITY_TYPES],
  // });

  /**
   * Updates settings with enforcement of locked fields and variant coercion.
   */
  const updateSettings = (next: ModelSettings) => {
    /* Merge-on-write while enforcing locked fields. */
    // const merged = enforceLocked({ ...settings, ...next });
    const merged = { ...settings, ...next };

    /* Ensure the variant stays valid after any model change. */
    const normalizedVariant = coerceVariant(merged.model, merged.model_variant);
    setState({ ...merged, model_variant: normalizedVariant });
  };

  return <Ctx.Provider value={{ settings, setSettings: updateSettings }}>{children}</Ctx.Provider>;
};

/**
 * Hook to access and update global model settings.
 *
 * This hook provides read and write access to the extraction model configuration
 * stored in the {@link ModelSettingsProvider} context. Use it in any component
 * that needs to display or modify model settings.
 *
 * @returns An object containing the current settings and a setter function.
 *
 * @example
 * ```tsx
 * function NormalizationToggle() {
 *   const { settings, setSettings } = useModelSettings();
 *
 *   const handleToggle = (checked: boolean) => {
 *     setSettings({ ...settings, normalize: checked });
 *   };
 *
 *   return (
 *     <Switch
 *       checked={settings.normalize}
 *       onChange={handleToggle}
 *       label="Enable entity normalization"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Building extraction request FormData
 * function useExtractionRequest() {
 *   const { settings } = useModelSettings();
 *
 *   const buildFormData = (text: string): FormData => {
 *     const formData = new FormData();
 *     formData.append("text", text);
 *     formData.append("model", settings.model);
 *     if (settings.model_variant) {
 *       formData.append("model_variant", settings.model_variant);
 *     }
 *     formData.append("normalize", String(settings.normalize));
 *     formData.append("systems_csv", settings.systems.join(","));
 *     return formData;
 *   };
 *
 *   return { buildFormData };
 * }
 * ```
 */
export const useModelSettings = () => useContext(Ctx);
