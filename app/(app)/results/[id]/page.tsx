"use client";

/**
 * Results page for displaying extraction output.
 *
 * This page fetches and displays the extraction results for a specific note
 * identified by the dynamic route parameter. It handles loading states, error
 * conditions, and renders the EntityResult component with the fetched data.
 *
 * @remarks
 * **Route:** `/results/[id]`
 *
 * The page uses client-side data fetching to retrieve the note data from the
 * Backend API. This approach allows for immediate navigation from the upload
 * page while the results are being fetched.
 *
 * @module app/(app)/results/[id]/page
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Typography, Alert } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import EntityResult from "@/components/results/entity-result";
import { fetchNote, downloadNoteExcel } from "@/lib/api";
import { ExtractResponse } from "@/lib/types";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { toUserMessage } from "@/lib/http";
import { notify } from "@/lib/notifications";

/**
 * Normalizes any error into a user-facing message.
 *
 * @param err - The error to normalize.
 * @returns A user-friendly error message string.
 *
 * @internal
 */
function getErrorMessage(err: unknown): string {
  return toUserMessage(err);
}

/**
 * Results page component displaying extraction output.
 *
 * Fetches the extraction results for the note ID from the URL parameter
 * and renders the EntityResult component with the data. Handles loading
 * and error states with appropriate UI feedback.
 *
 * @returns A React element containing the results view or error state.
 */
export default function ResultPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<ExtractResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  /**
   * Fetches note data on mount and when ID changes.
   */
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

  /**
   * Downloads the extraction result as an Excel file and triggers
   * a browser download via a temporary anchor element.
   */
  async function handleDownload() {
    if (!id) return;
    try {
      setDownloading(true);
      const blob = await downloadNoteExcel(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resultados_${id.slice(0, 8)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify.error(toUserMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="relative">
      <LoadingOverlay show={loading} text="Cargando resultados de extracción…" />
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          Resultados
        </Typography.Title>
        <div className="flex gap-2">
          <Button
            icon={<DownloadOutlined />}
            loading={downloading}
            disabled={!data}
            onClick={handleDownload}
          >
            Descargar Excel
          </Button>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>

      {/* Error state */}
      {!loading && err && <Alert type="error" message={err} />}

      {/* Results display */}
      {!loading && !err && data && <EntityResult data={data} />}
    </div>
  );
}
