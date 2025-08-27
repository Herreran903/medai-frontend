// app/(app)/results/page.tsx
"use client";

import { Button, Typography } from "antd";
import { useRouter } from "next/navigation";
import EntityResult from "@/components/results/entity-result";
import { useResult } from "@/components/providers/result-provider";

export default function ResultsPage() {
  const router = useRouter();
  const { result } = useResult();

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          Resultado
        </Typography.Title>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>

      {!result ? (
        <Typography.Text type="secondary">
          No hay resultados en memoria. Regresa y ejecuta una extracción.
        </Typography.Text>
      ) : (
        <EntityResult data={result} />
      )}
    </div>
  );
}
