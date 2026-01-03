"use client";

/**
 * Model settings drawer component for the MedAI frontend.
 *
 * This module provides a form-based configuration panel for extraction model
 * settings. It allows users to select the NER model family, configure model
 * variants, and adjust normalization parameters before processing clinical text.
 *
 * @remarks
 * The component integrates with the {@link ModelSettingsProvider} context to
 * persist settings across the application. Locked fields (vocabulary systems
 * and entity types for normalization) are intentionally hidden from the UI
 * as they are enforced by the provider.
 *
 * @example
 * ```tsx
 * import DrawerSetting from "@/components/settings/drawer-setting";
 * import { Drawer } from "antd";
 *
 * function SettingsPanel({ open, onClose }) {
 *   return (
 *     <Drawer title="Extraction Settings" open={open} onClose={onClose}>
 *       <DrawerSetting onClose={onClose} />
 *     </Drawer>
 *   );
 * }
 * ```
 *
 * @module drawer-setting
 */

import {
  Form,
  Input,
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

/**
 * Props for the {@link DrawerSetting} component.
 */
type DrawerSettingProps = {
  /**
   * Optional callback triggered after successfully saving settings.
   *
   * Typically used to close the parent drawer or modal after the user
   * submits the form. The callback is invoked after settings have been
   * persisted to the context provider.
   */
  onClose?: () => void;
};

/**
 * Resolves the default model variant for a given model family.
 *
 * This function ensures the settings form displays appropriate defaults
 * when the user switches between model families, keeping the UI aligned
 * with backend expectations.
 *
 * @param model - The model family to get the default variant for.
 * @returns The default variant string, or null for models without variants.
 *
 * @internal
 */
function defaultVariantForModel(model: ModelKind): string | null {
  if (model === "llm") return "claude";
  if (model === "transformer") return "beto";
  /* LSTM models do not expose configurable variants. */
  return null;
}

/**
 * Model family options displayed in the settings form.
 *
 * These options map to the {@link ModelKind} type and correspond to
 * different NER architectures supported by the Backend API.
 *
 * @internal
 */
const MODEL_OPTIONS: { label: string; value: ModelKind }[] = [
  { label: "Transformer", value: "transformer" },
  { label: "BiLSTM-CRF", value: "lstm" },
  { label: "LLM", value: "llm" },
];

/**
 * Configuration form for extraction model and normalization settings.
 *
 * This component provides a comprehensive settings interface that allows users
 * to configure the NER extraction pipeline before processing clinical text.
 * Settings are persisted to the {@link ModelSettingsProvider} context and
 * applied to all subsequent extraction requests.
 *
 * @remarks
 * **Form Sections:**
 * 1. **Model Selection** — Choose the NER model family (Transformer, LSTM, LLM)
 * 2. **Model Variant** — Select specific model implementation (varies by family)
 * 3. **Normalization** — Configure UMLS-based entity linking parameters
 *
 * **Locked Fields:**
 * The vocabulary systems (`systems`) and entity types (`restrict_types`) are
 * intentionally hidden from this form. These fields are locked to specific
 * values by the provider to ensure consistency with backend expectations.
 *
 * **Form Behavior:**
 * - Changing the model family automatically updates the variant to a valid default
 * - Numeric inputs are normalized before being saved to the context
 * - The Reset button restores form fields to their initial values (not defaults)
 *
 * **Client-Only Behavior:**
 * This component uses the "use client" directive as it relies on Ant Design
 * form components and React hooks that require browser APIs.
 *
 * @param props - Component props including the optional onClose callback.
 * @returns A React element containing the settings form.
 *
 * @example
 * ```tsx
 * // In a drawer or modal
 * function SettingsDrawer({ visible, onClose }) {
 *   return (
 *     <Drawer
 *       title="Extraction Settings"
 *       open={visible}
 *       onClose={onClose}
 *       width={400}
 *     >
 *       <DrawerSetting onClose={onClose} />
 *     </Drawer>
 *   );
 * }
 * ```
 */
export default function DrawerSetting({ onClose }: DrawerSettingProps) {
  const { settings, setSettings } = useModelSettings();
  const [form] = Form.useForm();
  const watchModel = Form.useWatch<ModelKind>("model", form);

  /**
   * Initial form values derived from current context settings.
   */
  const initialValues = {
    model: settings?.model ?? "transformer",
    model_variant: settings?.model_variant ?? undefined,
    normalize: settings?.normalize ?? false,
    min_link_score: settings?.min_link_score ?? 0.6,
    max_candidates: settings?.max_candidates ?? 25,
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={initialValues}
      onValuesChange={(changed) => {
        /* Auto-update variant when model family changes */
        if (Object.prototype.hasOwnProperty.call(changed, "model")) {
          const m = changed.model as ModelKind;
          form.setFieldsValue({ model_variant: defaultVariantForModel(m) });
        }
      }}
      onFinish={(vals) => {
        const variant =
          vals.model === "lstm"
            ? null
            : typeof vals.model_variant === "string" && vals.model_variant.trim().length > 0
              ? vals.model_variant.trim()
              : defaultVariantForModel(vals.model as ModelKind);

        /* Normalize numeric inputs and delegate locked fields to the provider. */
        const payload = {
          ...vals,
          model_variant: variant,
          min_link_score: Number(vals.min_link_score),
          max_candidates: Number(vals.max_candidates),
        };
        setSettings(payload);
        onClose?.();
      }}
    >
      <Typography.Paragraph type="secondary">
        Estos ajustes se aplican por defecto a todas las extracciones.
      </Typography.Paragraph>

      <Form.Item label="Modelo" name="model" rules={[{ required: true }]}>
        <Select options={MODEL_OPTIONS} />
      </Form.Item>

      {watchModel === "llm" && (
        <Form.Item
          label="Variante LLM"
          name="model_variant"
          extra="Por defecto: Claude. Tambien disponibles: GPT, Local (Ollama)."
        >
          <Select
            options={[
              { label: "Claude (por defecto)", value: "claude" },
              { label: "GPT", value: "gpt" },
              { label: "Local (Ollama)", value: "local" },
            ]}
          />
        </Form.Item>
      )}

      {watchModel === "transformer" && (
        <Form.Item
          label="Variante Transformer"
          name="model_variant"
          extra="Selecciona la variante del modelo (por defecto: BETO)."
        >
          <Select
            options={[
              { label: "BETO", value: "beto" },
              { label: "RoBERTa", value: "roberta" },
            ]}
          />
        </Form.Item>
      )}

      {watchModel === "lstm" && (
        <Form.Item label="Variante" extra="Los modelos LSTM no tienen variantes configurables.">
          <Input value="N/D" disabled />
        </Form.Item>
      )}

      <Divider />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Normalizacion (UMLS)
        </Typography.Title>
        <Tooltip title="Usa tu UMLS_APIKEY en el backend para mapear entidades a codigos RxNorm/SNOMED CT/ICD-10.">
          <InfoCircleOutlined />
        </Tooltip>
      </div>

      <Form.Item
        name="normalize"
        valuePropName="checked"
        style={{ marginTop: 8 }}
        extra="Si esta activado, las entidades extraidas se vinculan a codigos estandarizados."
      >
        <Switch checkedChildren="Activado" unCheckedChildren="Desactivado" />
      </Form.Item>

      <Form.Item
        label={
          <span>
            Umbral minimo de similitud{" "}
            <Tooltip title="Valores 0–1. Recomendado: 0.6–0.7 para equilibrio precision/recall.">
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
        name="min_link_score"
      >
        <InputNumber min={0} max={1} step={0.05} style={{ width: "100%" }} placeholder="0.60" />
      </Form.Item>

      <Form.Item
        label="Max. candidatos por entidad"
        name="max_candidates"
        tooltip="Numero de candidatos CUI antes de mapear a codigos de vocabulario."
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
