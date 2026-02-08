"use client";

/**
 * Batch upload component for the MedAI frontend.
 *
 * This module provides the interface for processing multiple clinical notes
 * in a single batch request. It allows users to upload multiple files,
 * assign per-file metadata (episode ID, date), and submit them together
 * for extraction.
 *
 * @remarks
 * **Workflow:**
 * 1. User uploads multiple clinical document files
 * 2. User assigns episode ID and date/time to each file in the metadata table
 * 3. Form validates that all files have complete metadata
 * 4. Request is sent to the Backend API batch extraction endpoint
 * 5. Results table displays per-file status with links to individual results
 *
 * **Supported File Types:**
 * - Plain text (.txt)
 * - PDF documents (.pdf)
 * - Microsoft Word (.doc, .docx)
 *
 * @example
 * ```tsx
 * import BatchUpload from "@/components/upload/batch-upload";
 *
 * function BatchExtractionPage() {
 *   return (
 *     <div className="max-w-4xl mx-auto">
 *       <h1>Batch Entity Extraction</h1>
 *       <BatchUpload />
 *     </div>
 *   );
 * }
 * ```
 *
 * @module batch-upload
 */

import { useState } from "react";
import { Upload, Table, Typography, Form, Button, Input, DatePicker, Space } from "antd";
import type { UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { InboxOutlined } from "@ant-design/icons";
import { extractEntitiesBatch } from "@/lib/api";
import type { BatchAckResponse } from "@/lib/types";
import type { Dayjs } from "dayjs";
import { useModelSettings } from "../providers/model-settings-provider";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { notify } from "@/lib/notifications";
import { toUserMessage } from "@/lib/http";

const { Dragger } = Upload;

/**
 * Batch extraction form component.
 *
 * This component provides the interface for processing multiple clinical notes
 * in a single batch request. It manages file uploads, per-file metadata collection,
 * batch submission, and results display.
 *
 * @remarks
 * **State Management:**
 * The component maintains separate state for:
 * - `files` — The list of uploaded files
 * - `dates` — Per-file date/time values keyed by file UID
 * - `episodes` — Per-file episode IDs keyed by file UID
 * - `rows` — Processing results for display in the results table
 *
 * **Backend Contract:**
 * The backend expects file-level metadata in the `notes_meta` JSON field,
 * which maps filenames to their associated episode IDs and note dates.
 *
 * **Results Display:**
 * After submission, the component switches to a results-only view showing
 * per-file status, entity counts, and links to individual result pages.
 *
 * @returns A React element containing the batch upload form and results table.
 *
 * @example
 * ```tsx
 * // In a page component
 * export default function BatchPage() {
 *   return (
 *     <div className="container">
 *       <h1>Batch Entity Extraction</h1>
 *       <p>Upload multiple clinical notes for processing.</p>
 *       <BatchUpload />
 *     </div>
 *   );
 * }
 * ```
 */
export default function BatchUpload() {
  const { settings } = useModelSettings();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dates, setDates] = useState<Record<string, Dayjs | null>>({});
  const [episodes, setEpisodes] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<RowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showResultsOnly, setShowResultsOnly] = useState(false);
  const modelLabel =
    settings.model === "lstm" ? "BiLSTM-CRF" : settings.model === "llm" ? "LLM" : "Transformer";

  /**
   * Transforms uploaded files into table data source format.
   */
  const preData: FileRow[] = files.map((f) => ({ key: f.uid, filename: f.name }));

  /**
   * Column definitions for the file metadata table.
   * @internal
   */
  const preColumns: ColumnsType<FileRow> = [
    { title: "Archivo", dataIndex: "filename", key: "filename" },
    {
      title: "Episodio",
      dataIndex: "key",
      key: "episode",
      render: (uid: string) => (
        <Input
          placeholder="ID de episodio"
          value={episodes[uid] ?? ""}
          onChange={(e) => setEpisodes((prev) => ({ ...prev, [uid]: e.target.value }))}
        />
      ),
    },
    {
      title: "Fecha",
      dataIndex: "key",
      key: "date",
      render: (uid: string) => (
        <DatePicker
          style={{ width: "100%" }}
          value={dates[uid] ?? null}
          showTime={{ format: "HH:mm", minuteStep: 1 }}
          format="YYYY-MM-DD HH:mm"
          onChange={(d) => setDates((prev) => ({ ...prev, [uid]: d }))}
        />
      ),
    },
  ];

  /**
   * Prevents automatic upload; files are submitted manually.
   * @internal
   */
  const beforeUpload: UploadProps["beforeUpload"] = () => false;

  /**
   * Handles file list changes and synchronizes metadata state.
   * @internal
   */
  const onChange: UploadProps["onChange"] = (info: UploadChangeParam<UploadFile>) => {
    const nextList = info.fileList as UploadFile[];
    setFiles(nextList);
    setDates((prev) => {
      const next: Record<string, Dayjs | null> = {};
      nextList.forEach((f) => {
        next[f.uid] = prev[f.uid] ?? null;
      });
      return next;
    });
    setEpisodes((prev) => {
      const next: Record<string, string> = {};
      nextList.forEach((f) => {
        next[f.uid] = prev[f.uid] ?? "";
      });
      return next;
    });
  };

  /**
   * Handles file removal and cleans up associated metadata.
   * @internal
   */
  const onRemove: UploadProps["onRemove"] = (f) => {
    setFiles((prev) => prev.filter((x) => x.uid !== f.uid));
    setDates((prev) => {
      const next = { ...prev };
      delete next[f.uid];
      return next;
    });
    setEpisodes((prev) => {
      const next = { ...prev };
      delete next[f.uid];
      return next;
    });
    return true;
  };

  /**
   * Handles form submission and batch extraction request.
   * @internal
   */
  const onFinish = async () => {
    if (!files.length) {
      notify.info("Selecciona archivos primero.");
      return;
    }

    /* Validate that each file has episode and date metadata. */
    const missing = files.filter((f) => {
      const ep = episodes[f.uid]?.trim();
      const dt = dates[f.uid];
      return !ep || !dt;
    });
    if (missing.length) {
      notify.error(
        "Falta completar episodio o fecha para uno o mas archivos. Indica el ID del episodio y selecciona la fecha para cada archivo."
      );
      return;
    }

    let closeLoading: (() => void) | null = null;
    try {
      setLoading(true);
      closeLoading = notify.loading("Procesando extraccion por lote…");

      const fd = new FormData();
      files.forEach((f) => {
        if (f.originFileObj) fd.append("files", f.originFileObj);
      });

      /* Backend API contract fields. */
      fd.append("model", settings.model);
      /* Optional model variant, when supported by the backend. */
      if (typeof settings.model_variant === "string" && settings.model_variant.trim().length > 0) {
        fd.append("model_variant", settings.model_variant.trim());
      }
      fd.append("save", "true");
      // Normalizacion deshabilitada temporalmente; se deja la logica como referencia.
      // if (typeof settings.normalize === "boolean") {
      //   fd.append("normalize", String(settings.normalize));
      // }
      // if (settings.systems?.length) {
      //   fd.append("systems_csv", settings.systems.join(","));
      // }
      // if (settings.restrict_types?.length) {
      //   fd.append("restrict_types_csv", settings.restrict_types.join(","));
      // }

      /* Per-file metadata so the backend can persist episode and note date. */
      const notesMeta = files.map((f) => ({
        filename: f.name,
        episode_id: (episodes[f.uid]?.trim() || null) as string | null,
        note_date: dates[f.uid] ? dates[f.uid]!.toDate().toISOString() : null,
      }));
      fd.append("notes_meta", JSON.stringify(notesMeta));

      setRows(files.map((f) => ({ key: f.uid, filename: f.name, status: "processing" })));

      /* Typed Backend API response. */
      const resp: BatchAckResponse = await extractEntitiesBatch(fd);

      /* Map backend acknowledgement items into table rows. */
      const items = Array.isArray(resp?.items) ? resp.items : [];
      const mapped: RowResult[] = items.map((it, idx) => {
        const hasError = Boolean(it.error);
        return {
          key: String(idx),
          filename: it.filename ?? `#${idx + 1}`,
          status: hasError ? "error" : "ok",
          count: typeof it.entity_count === "number" ? it.entity_count : undefined,
          error: hasError ? (it.error ?? "Error de procesamiento") : undefined,
          id: typeof it.id === "string" ? it.id : undefined,
        };
      });

      setRows(mapped);
      setShowResultsOnly(true);

      const errorCount = mapped.filter((m) => m.status === "error").length;
      if (errorCount > 0) {
        notify.error(`${errorCount} archivo(s) fallaron en el lote`);
      } else {
        notify.success("Extraccion completada");
      }
    } catch (e) {
      const msg = toUserMessage(e);
      notify.error(msg);
      setRows((prev) => prev.map((r) => ({ ...r, status: "error", error: r.error ?? msg })));
    } finally {
      setLoading(false);
      if (closeLoading) closeLoading();
    }
  };

  /**
   * Resets all form state to allow a new batch upload.
   * @internal
   */
  const clearAll = () => {
    setFiles([]);
    setDates({});
    setEpisodes({});
    setRows([]);
    setShowResultsOnly(false);
    form.resetFields();
  };

  return (
    <div className="space-y-3">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <LoadingOverlay show={loading} text="Procesando extraccion por lote…" />

        {!showResultsOnly && (
          <>
            <Dragger
              multiple
              accept=".txt,.pdf,.doc,.docx"
              beforeUpload={beforeUpload}
              onChange={onChange}
              onRemove={onRemove}
              fileList={files}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Arrastra o haz clic para seleccionar varios archivos
              </p>
              <p className="ant-upload-hint">
                Puedes seleccionar varios archivos. Se procesaran en un solo lote.
              </p>
            </Dragger>

            <Typography.Title level={5} style={{ marginTop: 12 }}>
              Archivos seleccionados
            </Typography.Title>
            <Table
              size="small"
              columns={preColumns}
              dataSource={preData}
              pagination={false}
              locale={{ emptyText: "Sin archivos seleccionados" }}
              rowKey="key"
            />

            <Space style={{ marginTop: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} disabled={!files.length}>
                Iniciar extraccion
              </Button>
              <Typography.Text type="secondary" className="capitalize">
                Modelo actual: <b>{modelLabel}</b>
                {/*
                  Variante oculta en UI (se fuerza en el provider):
                  - transformer -> roberta
                  - llm -> gpt
                */}
              </Typography.Text>
            </Space>
          </>
        )}
      </Form>

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Resultados de la extraccion
            </Typography.Title>
            <Button onClick={clearAll}>Limpiar</Button>
          </div>
          <Table<RowResult>
            size="small"
            rowKey="key"
            columns={[
              { title: "Archivo", dataIndex: "filename" },
              {
                title: "Estado",
                dataIndex: "status",
                render: (status: RowResult["status"]) =>
                  status === "processing" ? "Procesando" : status === "ok" ? "Completado" : "Error",
              },
              { title: "Entidades", dataIndex: "count" },
              { title: "Error", dataIndex: "error" },
              {
                title: "Accion",
                key: "action",
                render: (_: unknown, r: RowResult) =>
                  r.id ? <a href={`/results/${r.id}`}>Ver entidades</a> : null,
              },
            ]}
            dataSource={rows}
            pagination={false}
            scroll={{ y: 360 }}
          />
        </>
      )}
    </div>
  );
}

/**
 * Table row type for displaying batch processing results.
 *
 * Represents the status and outcome of a single file within a batch
 * extraction request, including entity count and navigation link.
 */
type RowResult = {
  /**
   * Stable key for React table rendering.
   */
  key: string;

  /**
   * Original filename provided by the user.
   */
  filename: string;

  /**
   * Processing status for the file.
   *
   * - `processing` — Currently being processed
   * - `ok` — Successfully processed
   * - `error` — Processing failed
   */
  status: "processing" | "ok" | "error";

  /**
   * Total number of extracted entities when available.
   */
  count?: number;

  /**
   * Error message returned by the Backend API when processing failed.
   */
  error?: string;

  /**
   * Backend note ID used to navigate to individual results.
   */
  id?: string;
};

/**
 * Lightweight file row type for the metadata collection table.
 *
 * Used to display uploaded files and collect per-file metadata
 * (episode ID, date) before batch submission.
 */
type FileRow = {
  /**
   * Stable key tied to the upload component's file UID.
   */
  key: string;

  /**
   * User-visible filename displayed in the metadata table.
   */
  filename: string;
};
