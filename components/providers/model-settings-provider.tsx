"use client";

/**
 * Model settings context provider for the MedAI frontend.
 *
 * This module provides a React Context-based state management solution for
 * extraction model configuration. It serves as the single source of truth for
 * model selection and variant coercion across all extraction workflows in the
 * application.
 *
 * @remarks
 * **Architectural Role:**
 * The provider enforces business rules that ensure UI selections remain compatible
 * with Backend API expectations by keeping model variants aligned with the selected
 * model family.
 *
 * **Key Features:**
 * - Centralized model configuration state
 * - Automatic variant coercion when switching model families
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
 * Supported extraction model families exposed in the UI.
 *
 * Each model family represents a different NER architecture with distinct
 * performance characteristics and resource requirements:
 *
 * - `transformer` — Transformer-based NER (RoBERTa con stride)
 * - `crf` — CRF clásico (sklearn-crfsuite)
 * - `lstm` — BiLSTM (solo)
 * - `lstm_crf` — BiLSTM-CRF
 * - `llm` — Large language model-based extraction (GPT)
 *
 * @remarks
 * The model family selection affects which variants are available and how
 * the extraction request is processed by the Backend API.
 */
export type ModelKind = "transformer" | "crf" | "lstm" | "lstm_crf" | "llm";

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
    case "crf":
    case "lstm":
    case "lstm_crf":
    default:
      /* These models do not expose configurable variants. */
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
   * - crf/lstm/lstm_crf -> null
   */
  void _variant;
  return defaultVariantForModel(model);
}

/**
 * Global extraction model settings shared across the application.
 *
 * This type defines the complete configuration state for entity extraction
 * requests. These values are used to build the FormData payload sent to
 * the Backend API extraction endpoints.
 *
 * @example
 * ```typescript
 * const settings: ModelSettings = {
 *   model: "transformer",
 *   model_variant: "roberta"
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
 * - Minimal configuration surface in the current UI
 */
export const DEFAULTS: ModelSettings = {
  model: "transformer",
  model_variant: defaultVariantForModel("transformer"),
};

/**
 * Context value type for the model settings provider.
 * @internal
 */
type ModelSettingsContextValue = {
  /** Current model settings state. */
  settings: ModelSettings;
  /**
   * Updates settings while enforcing variant coercion.
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
 * across the MedAI frontend. It manages state for model selection and variant
 * configuration while enforcing compatibility rules expected by the Backend API.
 *
 * @remarks
 * **Enforcement Behavior:**
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

  /**
   * Updates settings with variant coercion.
   */
  const updateSettings = (next: ModelSettings) => {
    /* Merge-on-write for the current model settings surface. */
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
 *     return formData;
 *   };
 *
 *   return { buildFormData };
 * }
 * ```
 */
export const useModelSettings = () => useContext(Ctx);
