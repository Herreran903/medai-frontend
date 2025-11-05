"use client";

/**
 * DrawerSetting()
 * Global extraction settings form.
 * - systems (SABs) and restrict_types are intentionally hidden and locked in the provider.
 * - This form only allows adjusting: model, normalization toggle, and numeric thresholds.
 * - The provider enforces immutability for locked fields on every update.
 */
import {
  Form,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Switch,
  Divider,
  Tooltip,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useModelSettings, type ModelKind } from "../providers/model-settings-provider";

const MODEL_OPTIONS: { label: string; value: ModelKind }[] = [
  { label: "Transformer", value: "transformer" },
  { label: "BiLSTM-CRF", value: "lstm" },
  { label: "LLM", value: "llm" },
];

export default function DrawerSetting({ onClose }: { onClose?: () => void }) {
  const { settings, setSettings } = useModelSettings();
  const [form] = Form.useForm();

  const initialValues = {
    model: settings?.model ?? "transformer",
    normalize: settings?.normalize ?? false,
    min_link_score: settings?.min_link_score ?? 0.6,
    max_candidates: settings?.max_candidates ?? 25,
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={initialValues}
      onFinish={(vals) => {
        // Normalize numeric inputs and delegate enforcement of locked fields to the provider
        const payload = {
          ...vals,
          min_link_score: Number(vals.min_link_score),
          max_candidates: Number(vals.max_candidates),
        };
        setSettings(payload);
        onClose?.();
      }}
    >
      <Typography.Paragraph type="secondary">
        Estos valores se aplican por defecto a las extracciones.
      </Typography.Paragraph>

      <Form.Item label="Modelo" name="model" rules={[{ required: true }]}>
        <Select options={MODEL_OPTIONS} />
      </Form.Item>

      <Divider />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Normalización (UTS/UMLS)
        </Typography.Title>
        <Tooltip title="Usa tu UMLS_APIKEY en el backend para mapear entidades a RxNorm/SNOMED/ICD-10.">
          <InfoCircleOutlined />
        </Tooltip>
      </div>

      <Form.Item
        name="normalize"
        valuePropName="checked"
        style={{ marginTop: 8 }}
        extra="Si está activado, intentará normalizar las entidades detectadas con el UTS."
      >
        <Switch checkedChildren="Activado" unCheckedChildren="Desactivado" />
      </Form.Item>

      <Form.Item
        label={
          <span>
            Umbral de similitud mínima{" "}
            <Tooltip title="Valores 0–1. Recomiendo 0.6–0.7.">
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
        name="min_link_score"
      >
        <InputNumber min={0} max={1} step={0.05} style={{ width: "100%" }} placeholder="0.60" />
      </Form.Item>

      <Form.Item
        label="Máx. candidatos por entidad"
        name="max_candidates"
        tooltip="Candidatos CUI a considerar antes de pivotear a vocabularios."
      >
        <InputNumber min={1} max={100} style={{ width: "100%" }} />
      </Form.Item>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={() => form.resetFields()}>Restablecer</Button>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Space>
    </Form>
  );
}
