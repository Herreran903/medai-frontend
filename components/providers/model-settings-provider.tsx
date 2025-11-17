"use client";

import React, { createContext, useContext, useState } from "react";

/**
 * Inmutable normalization configuration locked in the frontend.
 * These values are baked-in and cannot be edited from the UI.
 */
export const LOCKED_SABS = ["RXNORM", "SNOMEDCT_US", "ICD10CM"] as const;
export const LOCKED_ENTITY_TYPES = ["DX"] as const;
/** Supported extraction model kinds. */
export type ModelKind = "transformer" | "lstm" | "llm";

/** Allowed variants per model (used for UI hints and sane defaults). */
export const LLM_VARIANTS = ["claude", "gpt", "local"] as const;
export const TRANSFORMER_VARIANTS = ["beto", "roberta"] as const;
export type LlmVariant = (typeof LLM_VARIANTS)[number];
export type TransformerVariant = (typeof TRANSFORMER_VARIANTS)[number];

/** Compute default variant for a given model kind. */
function defaultVariantForModel(model: ModelKind): string | null {
  switch (model) {
    case "llm":
      return "claude";
    case "transformer":
      return "beto";
    case "lstm":
    default:
      return null; // LSTM has no variants
  }
}

/** Coerce a variant to match the selected model rules. */
function coerceVariant(model: ModelKind, variant: string | null | undefined): string | null {
  if (model === "lstm") return null;
  if (!variant || variant.trim() === "") return defaultVariantForModel(model);

  // Be permissive: backend validates unknown variants. We only ensure it belongs to the right family when possible.
  if (model === "llm") {
    // If it looks like a known transformer default lingering after a model switch, reset to llm default.
    if ((TRANSFORMER_VARIANTS as readonly string[]).includes(variant)) return "claude";
    return variant;
  }
  if (model === "transformer") {
    // If it looks like an llm-only value lingering after a model switch, reset to transformer default.
    if ((LLM_VARIANTS as readonly string[]).includes(variant)) return "beto";
    // Enforce only allowed transformer variants.
    if (!(TRANSFORMER_VARIANTS as readonly string[]).includes(variant)) return "beto";
    return variant;
  }
  return null;
}

/**
 * Global extraction model settings shared across the app.
 * Note: systems and restrict_types are locked to backend-supported defaults.
 */
export type ModelSettings = {
  /** NER/NLP model to use for extraction. */
  model: ModelKind;
  /** Optional model variant (backend optional parameter model_variant). */
  model_variant: string | null;
  /** Whether to attempt UTS/UMLS normalization. */
  normalize: boolean;
  /** Target vocabularies (SABs). Locked in frontend. */
  systems: string[];
  /** Entity types to normalize. Locked in frontend. */
  restrict_types: string[];
  /** Minimum similarity score for linking [0,1]. */
  min_link_score: number;
  /** Max candidate CUIs to consider per entity. */
  max_candidates: number;
};

/** Default settings applied on first load and when resetting. */
export const DEFAULTS: ModelSettings = {
  model: "transformer",
  model_variant: defaultVariantForModel("transformer"),
  normalize: false,
  // Use copies to avoid accidental external mutation
  systems: [...LOCKED_SABS],
  restrict_types: [...LOCKED_ENTITY_TYPES],
  min_link_score: 0.6,
  max_candidates: 25,
};

const Ctx = createContext<{
  settings: ModelSettings;
  /** Update settings; locked fields are enforced automatically. */
  setSettings: (s: ModelSettings) => void;
}>({ settings: DEFAULTS, setSettings: () => {} });

/**
 * Provider that stores and enforces invariant settings.
 * systems and restrict_types are always forced to LOCKED values.
 */
export const ModelSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setState] = useState<ModelSettings>(DEFAULTS);

  const enforceLocked = (s: ModelSettings): ModelSettings => ({
    ...s,
    systems: [...LOCKED_SABS],
    restrict_types: [...LOCKED_ENTITY_TYPES],
  });

  const updateSettings = (next: ModelSettings) => {
    // Merge-on-write while enforcing locked fields
    const merged = enforceLocked({ ...settings, ...next });

    // If model changes or variant is missing/invalid for the model, coerce a sane value.
    const normalizedVariant = coerceVariant(merged.model, merged.model_variant);
    setState({ ...merged, model_variant: normalizedVariant });
  };

  return <Ctx.Provider value={{ settings, setSettings: updateSettings }}>{children}</Ctx.Provider>;
};

/** Hook to access and update global model settings. */
export const useModelSettings = () => useContext(Ctx);
