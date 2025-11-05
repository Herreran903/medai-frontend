"use client";

/**
 * SingleUpload()
 * - Permite extracción por texto o un solo archivo.
 * - Usa la configuración global (model, normalize, SABs bloqueados, types bloqueados).
 * - Envía también min_link_score y max_candidates para coherencia con el flujo por lotes.
 */
import { useState, useMemo } from "react";
import {
  Button,
  Form,
  Input,
  Upload,
  message,
  Space,
  Typography,
  DatePicker,
  Row,
  Col,
  Spin,
} from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { extractEntities } from "@/lib/api";
import { useModelSettings } from "../providers/model-settings-provider";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";

const { Dragger } = Upload;
const { TextArea } = Input;

const ALLOWED_MIME = new Set<string>([
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXT = new Set<string>([".txt", ".pdf", ".doc", ".docx"]);

function hasAllowedExtension(filename?: string) {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return Array.from(ALLOWED_EXT).some((ext) => lower.endsWith(ext));
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Error al extraer";
}

type FormValues = {
  episodio: string;
  fecha: Dayjs;
  texto?: string;
  file?: UploadFile[];
};

export default function SingleUpload() {
  const { settings } = useModelSettings();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const texto = Form.useWatch<string>("texto", form);
  const watchedFiles = Form.useWatch<UploadFile[]>("file", form);
  const fileList = useMemo<UploadFile[]>(() => watchedFiles ?? [], [watchedFiles]);

  const normFile = (e: UploadChangeParam<UploadFile> | UploadFile[] | undefined): UploadFile[] => {
    if (Array.isArray(e)) return e;
    return e?.fileList ?? [];
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isMimeOk = file.type ? ALLOWED_MIME.has(file.type) : true;
    const isExtOk = hasAllowedExtension(file.name);
    if (!isMimeOk && !isExtOk) {
      message.error("Archivo no permitido. Usa TXT, PDF o DOC/DOCX.");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const hasValidFile = useMemo(() => {
    if (!fileList.length) return false;
    const f = fileList[0].originFileObj;
    if (!f) return false;
    const typeOk = f.type ? ALLOWED_MIME.has(f.type) : true;
    const extOk = hasAllowedExtension(f.name);
    return Boolean(typeOk || extOk);
  }, [fileList]);

  const hasText = useMemo(() => Boolean(texto && texto.trim().length > 0), [texto]);

  const textDisabled = hasValidFile;
  const uploadDisabled = hasText;
  const canSubmit = (hasText && !hasValidFile) || (hasValidFile && !hasText);

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v && v.trim().length > 0 && fileList.length) {
      form.setFieldsValue({ file: [] });
    }
  };

  const onUploadChange: UploadProps["onChange"] = ({ fileList: fl }) => {
    form.setFieldsValue({ file: fl as UploadFile[] });
    if (fl.length > 0 && hasText) {
      form.setFieldsValue({ texto: "" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    const canSubmitNow =
      (values.texto && values.texto.trim().length > 0 && !(values.file?.length ?? 0)) ||
      (values.file?.length === 1 && !(values.texto && values.texto.trim().length > 0));

    if (!canSubmitNow) {
      message.warning("Proporciona texto o un archivo válido (solo uno).");
      return;
    }

    try {
      await form.validateFields(["episodio", "fecha"]);
      setLoading(true);

      const fd = new FormData();

      const trimmed = values.texto?.trim();
      if (trimmed) fd.append("text", trimmed);

      const f = values.file?.[0]?.originFileObj;
      if (f) fd.append("file", f);

      // Metadatos de la nota
      fd.append("episode_id", String(values.episodio).trim());
      fd.append("note_date", values.fecha.toDate().toISOString());

      // Configuración del modelo / normalización
      fd.append("model", settings.model);
      fd.append("normalize", String(settings.normalize));

      // Vocabularios y tipos bloqueados (definidos en el provider)
      if (settings.systems?.length) {
        fd.append("systems_csv", settings.systems.join(","));
      }
      if (settings.restrict_types?.length) {
        fd.append("restrict_types_csv", settings.restrict_types.join(","));
      }

      // Umbral y número de candidatos: se envían también en flujo individual
      if (typeof settings.min_link_score === "number") {
        fd.append("min_link_score", settings.min_link_score.toString());
      }
      if (typeof settings.max_candidates === "number") {
        fd.append("max_candidates", settings.max_candidates.toString());
      }

      const ack = await extractEntities(fd);

      if (!ack?.id) {
        message.warning("La extracción no devolvió un ID.");
        return;
      }
      if (!ack.stored) {
        message.warning("La nota no fue almacenada (save=false o política de guardado).");
      }

      const url = `/results/${ack.id}`;
      window.location.assign(url);
    } catch (e: unknown) {
      const isFieldsError =
        typeof e === "object" &&
        e !== null &&
        "errorFields" in e &&
        Array.isArray(e.errorFields);
      if (isFieldsError) {
        message.error("Completa el número de episodio y la fecha.");
      } else {
        message.error(getErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form layout="vertical" form={form} onFinish={onSubmit}>
        <Spin spinning={loading} fullscreen tip="Procesando…" />
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Número de episodio"
              name="episodio"
              rules={[{ required: true, message: "Ingresa el número de episodio" }]}
            >
              <Input placeholder="Ej: 110006-168633 (o el ID numérico)" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Fecha y hora de la nota"
              name="fecha"
              rules={[{ required: true, message: "Selecciona la fecha y la hora" }]}
            >
              <DatePicker
                className="w-full"
                style={{ width: "100%" }}
                showTime={{ format: "HH:mm", minuteStep: 1 }}
                format="YYYY-MM-DD HH:mm"
                use12Hours={false}
                inputReadOnly
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Texto" name="texto">
          <TextArea
            rows={6}
            placeholder={
              textDisabled
                ? "Se deshabilitó por haber subido un archivo"
                : "Pega aquí la historia clínica…"
            }
            disabled={textDisabled}
            onChange={onTextChange}
          />
        </Form.Item>

        <Form.Item
          label="Archivo"
          name="file"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          extra="Solo se permiten TXT, PDF o DOC/DOCX. Máximo 1 archivo."
        >
          <Dragger
            multiple={false}
            maxCount={1}
            disabled={uploadDisabled}
            accept=".txt,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            beforeUpload={beforeUpload}
            onChange={onUploadChange}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploadDisabled
                ? "Deshabilitado porque hay texto"
                : "Arrastra o haz clic para seleccionar un archivo"}
            </p>
            <p className="ant-upload-hint">TXT, PDF o DOC(X)</p>
          </Dragger>
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!canSubmit}>
            Extraer entidades
          </Button>
          <Typography.Text type="secondary" className="capitalize">
            Modelo actual: <b>{settings.model}</b>
          </Typography.Text>
        </Space>
      </Form>
    </div>
  );
}
