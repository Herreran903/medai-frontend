"use client";

import { useState } from "react";
import { Upload, Table, message, Typography, Form, Button } from "antd";
import { InboxOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { extractEntitiesBatch } from "@/lib/api";
import { useModelSettings } from "../providers/model-settings-provider";

const { Dragger } = Upload;

type Row = { key: string; filename: string; status: string; count?: number; error?: string };

export default function BatchUpload() {
  const { settings } = useModelSettings();
  const [rows, setRows] = useState<Row[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    { title: "Archivo", dataIndex: "filename" },
    { title: "Estado", dataIndex: "status" },
    { title: "Entidades", dataIndex: "count" },
  ];

  const handleProcess = async () => {
    if (!files.length) return message.info("Selecciona archivos primero.");
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f.originFileObj as File));
    fd.append("model", settings.model);

    setLoading(true);
    setRows(files.map((f) => ({ key: f.uid, filename: f.name, status: "procesando" })));

    try {
      const result = await extractEntitiesBatch(fd);
      const mapped: Row[] = (result || []).map((r: any, idx: number) => ({
        key: String(idx),
        filename: r.filename || `#${idx + 1}`,
        status: Array.isArray(r.entities) ? "ok" : "error",
        count: Array.isArray(r.entities) ? r.entities.length : 0,
        error: Array.isArray(r.entities) ? undefined : "Sin entidades o error",
      }));
      setRows(mapped);
      message.success("Lote procesado");
    } catch (e: any) {
      message.error(e.message || "Error en el lote");
      setRows((prev) => prev.map((r) => ({ ...r, status: "error" })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Dragger
        multiple
        accept=".txt,.pdf,.doc,.docx"
        beforeUpload={(_, fl) => {
          setFiles(fl as any[]);
          return false;
        }}
        fileList={files}
        onRemove={(f) => {
          setFiles((prev) => prev.filter((x) => x.uid !== f.uid));
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Arrastra o haz clic para seleccionar varios archivos</p>
        <p className="ant-upload-hint">
          Se usarán el modelo y umbral configurados en el panel lateral.
        </p>
      </Dragger>

      <Form.Item>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleProcess}
          loading={loading}
          disabled={!files.length}
        >
          Procesar lote
        </Button>
      </Form.Item>

      <Typography.Title level={5}>Resultados</Typography.Title>
      <Table size="small" columns={columns} dataSource={rows} pagination={false} />
    </div>
  );
}
