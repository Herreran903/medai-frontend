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

/**
 * Global extraction model settings shared across the app.
 * Note: systems and restrict_types are locked to backend-supported defaults.
 */
export type ModelSettings = {
  /** NER/NLP model to use for extraction. */
  model: ModelKind;
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
    setState(enforceLocked({ ...settings, ...next }));
  };

  return <Ctx.Provider value={{ settings, setSettings: updateSettings }}>{children}</Ctx.Provider>;
};

/** Hook to access and update global model settings. */
export const useModelSettings = () => useContext(Ctx);
