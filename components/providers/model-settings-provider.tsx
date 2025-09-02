"use client";

import React, { createContext, useContext, useState } from "react";

export type ModelSettings = {
  model: string;
  normalize: boolean;
  systems: string[];
  restrict_types: string[];
  min_link_score: number;
  max_candidates: number;
};

export const DEFAULTS: ModelSettings = {
  model: "transformer",
  normalize: false,
  systems: ["RXNORM", "SNOMEDCT_US", "ICD10CM"],
  restrict_types: ["MEDICAMENTO", "CANCER", "TRATAMIENTO", "CIRUGIA"],
  min_link_score: 0.6,
  max_candidates: 25,
};

const Ctx = createContext<{
  settings: ModelSettings;
  setSettings: (s: ModelSettings) => void;
}>({ settings: DEFAULTS, setSettings: () => {} });

export const ModelSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
};

export const useModelSettings = () => useContext(Ctx);
