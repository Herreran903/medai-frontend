"use client";

import { useState } from "react";
import { Button, Form, Input, Upload, message, Space, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { extractEntities } from "@/lib/api";
import { useModelSettings } from "../providers/model-settings-provider";
import EntityResult from "../results/entity-result";

const { Dragger } = Upload;
const { TextArea } = Input;

export default function SingleUpload() {
  const { settings } = useModelSettings();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [form] = Form.useForm();

  const onSubmit = async (values: any) => {
    if (!values.texto && !values.file?.file?.originFileObj) {
      message.warning("Proporciona texto o un archivo.");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      if (values.texto) fd.append("text", values.texto);
      if (values.file?.file?.originFileObj)
        fd.append("file", values.file.file.originFileObj as File);
      fd.append("model", settings.model);
      fd.append("threshold", String(settings.threshold));
      const data = await extractEntities(fd);
      setResult(data);
      message.success("Entidades extraídas");
    } catch (e: any) {
      message.error(e.message || "Error al extraer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form layout="vertical" form={form} onFinish={onSubmit}>
        <Form.Item label="Texto (opcional)" name="texto">
          <TextArea rows={6} placeholder="Pega aquí la historia clínica…" />
        </Form.Item>

        <Form.Item label="Archivo (opcional)" name="file" valuePropName="file">
          <Dragger multiple={false} maxCount={1} accept=".txt,.pdf,.doc,.docx">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Arrastra o haz clic para subir</p>
            <p className="ant-upload-hint">TXT, PDF o DOC(X)</p>
          </Dragger>
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Extraer entidades
          </Button>
          <Typography.Text type="secondary">
            Modelo actual: <b>{settings.model}</b> · Umbral: <b>{settings.threshold}</b>
          </Typography.Text>
        </Space>
      </Form>

      {result && (
        <>
          <Typography.Title level={5}>Resultado</Typography.Title>
          <EntityResult data={result} />
        </>
      )}
    </div>
  );
}
