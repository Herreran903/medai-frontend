"use client";

import { Form, InputNumber, Select, Button, Space, Typography } from "antd";
import { useModelSettings } from "../providers/model-settings-provider";

const MODEL_OPTIONS = [
  { label: "Transformer", value: "transformer" },
  { label: "BiLSTM-CRF", value: "lstm" },
  { label: "LLM", value: "llm" },
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

      <Space>
        <Button onClick={() => form.resetFields()}>Restablecer</Button>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Space>
    </Form>
  );
}
