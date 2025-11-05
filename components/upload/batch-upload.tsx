"use client";

/**
 * BatchUpload()
 * Subida y extracción en lote para múltiples archivos.
 *
 * Contrato del endpoint backend (POST /extract-batch):
 * - FormData enviado por el frontend:
 *   - files: File[]                // uno o más archivos (clave repetida "files")
 *   - model: string                // modelo de extracción
 *   - save: "true" | "false"       // explícito; el frontend envía "true"
 *   - normalize: "true" | "false"
 *   - systems_csv: string          // CSV de SABs bloqueados (p. ej. "RXNORM,SNOMEDCT_US,ICD10CM")
 *   - restrict_types_csv: string   // CSV de tipos bloqueados (p. ej. "DX")
 *   - notes_meta: string           // JSON.stringify([{ filename, episode_id, note_date }])
 *                                  //  - episode_id: string | null (por archivo)
 *                                  //  - note_date: ISO string | null (por archivo)
 * - Respuesta (JSON):
 *   {
 *     items: Array<{
 *       filename: string;
 *       id?: string | null;
 *       stored: boolean;
 *       entity_count?: number | null;
 *       url?: string | null;
 *       error?: string | null;
 *     }>
 *   }
 *
 * Notas:
 * - Los SABs y tipos se bloquean desde el provider y no son editables.
 * - notes_meta permite que el backend guarde por (episode_id, note_date) por archivo.
 * - La tabla de resultados incluye un link "Ver entidades" cuando el backend devuelve id.
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

type RowResult = {
  key: string;
  filename: string;
  status: "procesando" | "ok" | "error";
  count?: number;
  error?: string;
  id?: string;
};

type FileRow = { key: string; filename: string };

/** La respuesta tipada viene dada por BatchAckResponse.items (ver lib/types). */

export default function BatchUpload() {
  const { settings } = useModelSettings();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dates, setDates] = useState<Record<string, Dayjs | null>>({});
  const [episodes, setEpisodes] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<RowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showResultsOnly, setShowResultsOnly] = useState(false);

  const preData: FileRow[] = files.map((f) => ({ key: f.uid, filename: f.name }));

  const preColumns: ColumnsType<FileRow> = [
    { title: "Archivo", dataIndex: "filename", key: "filename" },
    {
      title: "Episodio",
      dataIndex: "key",
      key: "episode",
      render: (uid: string) => (
        <Input
          placeholder="ID/Episodio"
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

  const beforeUpload: UploadProps["beforeUpload"] = () => false;

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

  const onFinish = async () => {
    if (!files.length) {
      notify.info("Selecciona archivos primero.");
      return;
    }

    // Validar que cada archivo tenga episodio y fecha asignados
    const missing = files.filter((f) => {
      const ep = episodes[f.uid]?.trim();
      const dt = dates[f.uid];
      return !ep || !dt;
    });
    if (missing.length) {
      notify.error(
        "Falta completar episodio y fecha para uno o más archivos. Indica el ID del episodio y selecciona la fecha para cada archivo."
      );
      return;
    }

    let cerrarCargando: (() => void) | null = null;
    try {
      setLoading(true);
      cerrarCargando = notify.loading("Procesando extracción…");

      const fd = new FormData();
      files.forEach((f) => {
        if (f.originFileObj) fd.append("files", f.originFileObj);
      });

      // Campos esperados por el endpoint
      fd.append("model", settings.model);
      fd.append("save", "true"); // explícito aunque el backend por defecto sea True
      if (typeof settings.normalize === "boolean") {
        fd.append("normalize", String(settings.normalize));
      }
      if (settings.systems?.length) {
        fd.append("systems_csv", settings.systems.join(","));
      }
      if (settings.restrict_types?.length) {
        fd.append("restrict_types_csv", settings.restrict_types.join(","));
      }

      // Metadatos por archivo (para que el backend guarde por episodio/fecha)
      const notesMeta = files.map((f) => ({
        filename: f.name,
        episode_id: (episodes[f.uid]?.trim() || null) as string | null,
        note_date: dates[f.uid] ? dates[f.uid]!.toDate().toISOString() : null,
      }));
      fd.append("notes_meta", JSON.stringify(notesMeta));

      setRows(files.map((f) => ({ key: f.uid, filename: f.name, status: "procesando" })));

      // Llamado tipado al backend
      const resp: BatchAckResponse = await extractEntitiesBatch(fd);

      // Mapeo a filas de la tabla desde la respuesta tipada
      const items = Array.isArray(resp?.items) ? resp.items : [];
      const mapped: RowResult[] = items.map((it, idx) => {
        const hasError = Boolean(it.error);
        return {
          key: String(idx),
          filename: it.filename ?? `#${idx + 1}`,
          status: hasError ? "error" : "ok",
          count: typeof it.entity_count === "number" ? it.entity_count : undefined,
          error: hasError ? (it.error ?? "Error en procesamiento") : undefined,
          id: typeof it.id === "string" ? it.id : undefined,
        };
      });

      setRows(mapped);
      setShowResultsOnly(true);

      const errorCount = mapped.filter((m) => m.status === "error").length;
      if (errorCount > 0) {
        notify.error(`${errorCount} archivo(s) fallaron en el lote`);
      } else {
        notify.success("Extracción completada");
      }
    } catch (e) {
      const msg = toUserMessage(e);
      notify.error(msg);
      setRows((prev) => prev.map((r) => ({ ...r, status: "error", error: r.error ?? msg })));
    } finally {
      setLoading(false);
      if (cerrarCargando) cerrarCargando();
    }
  };

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
        {/* Muestra un overlay de carga mientras se procesa la extracción */}
        <LoadingOverlay show={loading} text="Procesando extracción…" />
        {/* Este endpoint no requiere campos adicionales en el formulario */}

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
                Puedes seleccionar varios archivos. Se procesarán en un solo lote.
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
              locale={{ emptyText: "Sin archivos" }}
              rowKey="key"
            />

            <Space style={{ marginTop: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} disabled={!files.length}>
                Iniciar extracción
              </Button>
              <Typography.Text type="secondary" className="capitalize">
                Modelo actual: <b>{settings.model}</b>
              </Typography.Text>
            </Space>
          </>
        )}
      </Form>

      {/* Resultados */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Resultados de la extracción
            </Typography.Title>
            <Button onClick={clearAll}>Limpiar</Button>
          </div>
          <Table<RowResult>
            size="small"
            rowKey="key"
            columns={[
              { title: "Archivo", dataIndex: "filename" },
              { title: "Estado", dataIndex: "status" },
              { title: "Entidades", dataIndex: "count" },
              { title: "Error", dataIndex: "error" },
              {
                title: "Acción",
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
