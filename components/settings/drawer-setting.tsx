"use client";

import { Form, InputNumber, Select, Button, Space, Typography } from "antd";
import { useModelSettings } from "../providers/model-settings-provider";

const MODEL_OPTIONS = [
  { label: "spanish-med-ner", value: "spanish-med-ner" },
  { label: "clinical-ner-1", value: "clinical-ner-1" },
  { label: "biomed-ner-large", value: "biomed-ner-large" },
];

export default function DrawerSetting({ onClose }: { onClose?: () => void }) {
  const { settings, setSettings } = useModelSettings();
  const [form] = Form.useForm();

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={settings}
      onFinish={(vals) => {
        setSettings(vals);
        onClose?.();
      }}
    >
      <Typography.Paragraph type="secondary">
        Estos valores se aplican por defecto a las extracciones.
      </Typography.Paragraph>

      <Form.Item label="Modelo" name="model" rules={[{ required: true }]}>
        <Select options={MODEL_OPTIONS} />
      </Form.Item>

      <Form.Item label="Umbral de confianza" name="threshold">
        <InputNumber min={0} max={1} step={0.05} style={{ width: 140 }} />
      </Form.Item>

      <Space>
        <Button onClick={() => form.resetFields()}>Restablecer</Button>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Space>
    </Form>
  );
}
