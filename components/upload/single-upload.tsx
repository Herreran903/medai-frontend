"use client";

import { useState, useMemo } from "react";
import { Button, Form, Input, Upload, message, Space, Typography, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { extractEntities } from "@/lib/api";
import { useModelSettings } from "../providers/model-settings-provider";
import { useRouter } from "next/navigation";
import { useResult } from "@/components/providers/result-provider";

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

export default function SingleUpload() {
  const router = useRouter();
  const { settings } = useModelSettings();
  const { setResult } = useResult();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const texto: string | undefined = Form.useWatch("texto", form);
  const fileList = (Form.useWatch("file", form) as any[]) ?? [];

  const normFile = (e: any) => (Array.isArray(e) ? e : (e?.fileList ?? []));

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
    const f = fileList[0]?.originFileObj || fileList[0]?.file || fileList[0];
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
    form.setFieldsValue({ file: fl });
    if (fl.length > 0 && hasText) {
      form.setFieldsValue({ texto: "" });
    }
  };

  const onSubmit = async (values: any) => {
    if (!canSubmit) {
      message.warning("Proporciona texto o un archivo válido (solo uno).");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      if (values.texto?.trim()) fd.append("text", values.texto.trim());
      const f = values.file?.[0]?.originFileObj ?? values.file?.[0]?.file;
      if (f) fd.append("file", f as File);
      fd.append("model", settings.model);
      fd.append("normalize", String(settings.normalize));

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

      const data = await extractEntities(fd);
      setResult(data);
      router.push("/results");
    } catch (e: any) {
      message.error(e?.message || "Error al extraer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form layout="vertical" form={form} onFinish={onSubmit}>
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
              {uploadDisabled ? "Deshabilitado porque hay texto" : "Arrastra o haz clic para subir"}
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
