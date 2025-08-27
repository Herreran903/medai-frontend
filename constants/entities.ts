export type BaseEntity =
  | "BIOMARCADOR"
  | "CANCER"
  | "CIRUGIA"
  | "DOSIS"
  | "EDAD"
  | "FECHA"
  | "GLEASON"
  | "MEDICAMENTO"
  | "TNM"
  | "TRATAMIENTO";

export const ENTITY_INFO: Record<BaseEntity, { color: `#${string}`; description: string }> = {
  BIOMARCADOR: {
    color: "#1f77b4",
    description: "Marcadores bioquímicos (p. ej., PSA).",
  },
  CANCER: {
    color: "#d62728",
    description: "Menciones de cáncer / neoplasia y sus atributos.",
  },
  CIRUGIA: {
    color: "#2ca02c",
    description: "Procedimientos o antecedentes quirúrgicos.",
  },
  DOSIS: {
    color: "#ff7f0e",
    description: "Cantidad/posología (ej. mg, UI) de un agente.",
  },
  EDAD: {
    color: "#9467bd",
    description: "Edad del paciente.",
  },
  FECHA: {
    color: "#8c564b",
    description: "Fechas clínicas o temporales relevantes.",
  },
  GLEASON: {
    color: "#17becf",
    description: "Puntaje de Gleason y patrones relacionados.",
  },
  MEDICAMENTO: {
    color: "#e377c2",
    description: "Fármacos, principios activos o nombres comerciales.",
  },
  TNM: {
    color: "#7f7f7f",
    description: "Estadificación TNM oncológica.",
  },
  TRATAMIENTO: {
    color: "#bcbd22",
    description: "Terapias o líneas de tratamiento no necesariamente farmacológicas.",
  },
};

export function getEntityColor(label: string): string {
  return label in ENTITY_INFO ? ENTITY_INFO[label as BaseEntity].color : "#999999";
}

export function getEntityDescription(label: string): string | null {
  return label in ENTITY_INFO ? ENTITY_INFO[label as BaseEntity].description : null;
}
