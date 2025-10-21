"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Typography, Spin, Alert } from "antd";
import EntityResult from "@/components/results/entity-result";
import { fetchNote } from "@/lib/api";
import { ExtractResponse } from "@/lib/types";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return "Error al cargar la nota";
}

export default function ResultPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<ExtractResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchNote(id);
        if (isMounted) setData(res);
      } catch (e) {
        if (isMounted) setErr(getErrorMessage(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          Resultado
        </Typography.Title>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>

      {loading && <Spin fullscreen tip="Cargando resultado…" />}

      {!loading && err && <Alert type="error" message={err} />}

      {!loading && !err && data && <EntityResult data={data} />}
    </div>
  );
}
