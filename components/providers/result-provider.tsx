"use client";
import React, { createContext, useContext, useState } from "react";

type ResultContextType = {
  result: any | null;
  setResult: (r: any | null) => void;
  clear: () => void;
};

const Ctx = createContext<ResultContextType>({
  result: null,
  setResult: () => {},
  clear: () => {},
});

export const ResultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [result, setResult] = useState<any | null>(null);
  const clear = () => setResult(null);
  return <Ctx.Provider value={{ result, setResult, clear }}>{children}</Ctx.Provider>;
};

export const useResult = () => useContext(Ctx);
