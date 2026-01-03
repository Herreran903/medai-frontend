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
import EntityResult from "@/components/results/entity-result";
import { fetchNote } from "@/lib/api";
import { ExtractResponse } from "@/lib/types";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { toUserMessage } from "@/lib/http";

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

  return (
    <div className="relative">
      <LoadingOverlay show={loading} text="Cargando resultados de extracción…" />
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          Resultados
        </Typography.Title>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>

      {/* Error state */}
      {!loading && err && <Alert type="error" message={err} />}

      {/* Results display */}
      {!loading && !err && data && <EntityResult data={data} />}
    </div>
  );
}
