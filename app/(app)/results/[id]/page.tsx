"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Typography, Alert } from "antd";
import EntityResult from "@/components/results/entity-result";
import { fetchNote } from "@/lib/api";
import { ExtractResponse } from "@/lib/types";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { toUserMessage } from "@/lib/http";

function getErrorMessage(err: unknown): string {
  return toUserMessage(err);
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
    <div className="relative">
      <LoadingOverlay show={true} text="Procesando extracción…" />
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          Resultado
        </Typography.Title>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>

      {/* Loader gestionado por LoadingOverlay */}

      {!loading && err && <Alert type="error" message={err} />}

      {!loading && !err && data && <EntityResult data={data} />}
    </div>
  );
}
