"use client";

import { useState } from "react";
import {
  Upload,
  Table,
  Typography,
  Form,
  Button,
  Input,
  DatePicker,
  Row,
  Col,
  Space,
  message,
} from "antd";
import type { UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { InboxOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { extractEntitiesBatch } from "@/lib/api";
import { useModelSettings } from "../providers/model-settings-provider";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";

const { Dragger } = Upload;

type RowResult = {
  key: string;
  filename: string;
  status: "procesando" | "ok" | "error";
  count?: number;
  error?: string;
};

type FileRow = { key: string; filename: string };
type FormValues = { episode: string };

type BatchApiItem = {
  filename?: string;
  entities?: unknown[];
  error?: string;
};

export default function BatchUpload() {
  const { settings } = useModelSettings();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dates, setDates] = useState<Record<string, Dayjs | null>>({});
  const [rows, setRows] = useState<RowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const preData: FileRow[] = files.map((f) => ({ key: f.uid, filename: f.name }));

  const preColumns: ColumnsType<FileRow> = [
    { title: "Archivo", dataIndex: "filename", key: "filename" },
    {
      title: "Fecha",
      dataIndex: "key",
      key: "date",
      render: (uid: string) => (
        <DatePicker
          style={{ width: "100%" }}
          value={dates[uid] ?? null}
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
  };

  const onRemove: UploadProps["onRemove"] = (f) => {
    setFiles((prev) => prev.filter((x) => x.uid !== f.uid));
    setDates((prev) => {
      const next = { ...prev };
      delete next[f.uid];
      return next;
    });
    return true;
  };

  const onFinish = async (values: FormValues) => {
    if (!files.length) {
      message.info("Selecciona archivos primero.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      files.forEach((f) => {
        if (f.originFileObj) fd.append("files", f.originFileObj);
      });

      fd.append("model", settings.model);
      if (typeof settings.normalize === "boolean") {
        fd.append("normalize", String(settings.normalize));
      }
      if (settings.systems?.length) {
        fd.append("systems", settings.systems.join(","));
      }
      if (settings.restrict_types?.length) {
        fd.append("restrict_types", settings.restrict_types.join(","));
      }
      if (typeof settings.min_link_score === "number") {
        fd.append("min_link_score", settings.min_link_score.toString());
      }
      if (typeof settings.max_candidates === "number") {
        fd.append("max_candidates", settings.max_candidates.toString());
      }

      fd.append("episode_id", String(values.episode).trim());
      const notesMeta = files.map((f) => ({
        filename: f.name,
        note_date: dates[f.uid]?.toDate().toISOString() ?? null,
      }));
      fd.append("notes_meta", JSON.stringify(notesMeta));

      setRows(files.map((f) => ({ key: f.uid, filename: f.name, status: "procesando" })));

      const result = (await extractEntitiesBatch(fd)) as unknown as BatchApiItem[] | undefined;

      const mapped: RowResult[] = (result ?? []).map((r, idx) => {
        const ok = Array.isArray(r.entities);
        return {
          key: String(idx),
          filename: r.filename ?? `#${idx + 1}`,
          status: ok ? "ok" : "error",
          count: ok ? r.entities!.length : 0,
          error: ok ? undefined : (r.error ?? "Sin entidades o error"),
        };
      });

      setRows(mapped);
      message.success("Lote procesado");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error en el lote";
      message.error(msg);
      setRows((prev) => prev.map((r) => ({ ...r, status: "error" })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Número de episodio"
              name="episode"
              rules={[{ required: true, message: "Ingresa el número de episodio" }]}
            >
              <Input placeholder="Ej: 110006-168633 (o el ID numérico)" />
            </Form.Item>
          </Col>
        </Row>

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
          <p className="ant-upload-text">Arrastra o haz clic para seleccionar varios archivos</p>
          <p className="ant-upload-hint">
            Todos pertenecen al mismo episodio; asigna la fecha por archivo abajo.
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
            Extraer entidades
          </Button>
          <Typography.Text type="secondary" className="capitalize">
            Modelo actual: <b>{settings.model}</b>
          </Typography.Text>
        </Space>
      </Form>

      {/* Resultados (opcional: déjalo si quieres visualizar al final) */}
      {rows.length > 0 && (
        <>
          <Typography.Title level={5} style={{ marginTop: 16 }}>
            Resultados del lote
          </Typography.Title>
          <Table<RowResult>
            size="small"
            rowKey="key"
            columns={[
              { title: "Archivo", dataIndex: "filename" },
              { title: "Estado", dataIndex: "status" },
              { title: "Entidades", dataIndex: "count" },
              { title: "Error", dataIndex: "error" },
            ]}
            dataSource={rows}
            pagination={false}
          />
        </>
      )}
    </div>
  );
}
