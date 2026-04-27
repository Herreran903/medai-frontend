"use client";

/**
 * Model settings drawer component for the MedAI frontend.
 *
 * This module provides a form-based configuration panel for extraction model
 * settings. In the current UI, users can select the NER model family only.
 * Model variant values are derived automatically from the selected family.
 *
 * @remarks
 * The component integrates with the {@link ModelSettingsProvider} context to
 * persist settings across the application and keep variant values aligned with
 * backend expectations.
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

import { Form, Select, Button, Space, Typography } from "antd";
import LlmPrivacyAlert from "@/components/ui/llm-privacy-alert";
import {
  defaultVariantForModel,
  useModelSettings,
  type ModelKind,
} from "../providers/model-settings-provider";

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
 * Model family options displayed in the settings form.
 *
 * These options map to the {@link ModelKind} type and correspond to
 * different NER architectures supported by the Backend API.
 *
 * @internal
 */
const MODEL_OPTIONS: { label: string; value: ModelKind }[] = [
  { label: "Transformer", value: "transformer" },
  { label: "CRF", value: "crf" },
  { label: "BiLSTM", value: "lstm" },
  { label: "BiLSTM-CRF", value: "lstm_crf" },
  { label: "LLM", value: "llm" },
];

/**
 * Configuration form for extraction model settings.
 *
 * This component provides a compact settings interface that allows users
 * to configure the model family used for NER extraction before processing
 * clinical text.
 * Settings are persisted to the {@link ModelSettingsProvider} context and
 * applied to all subsequent extraction requests.
 *
 * @remarks
 * **Form Sections:**
 * 1. **Model Selection** — Choose the NER model family (Transformer, CRF, BiLSTM, BiLSTM-CRF, LLM)
 * 2. **Model Variant (implicit)** — Derived automatically from the selected family
 *
 * **Form Behavior:**
 * - Changing the model family automatically updates the variant to a valid default
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
  const initialModel = settings?.model ?? "transformer";
  const watchedModel = Form.useWatch<ModelKind>("model", form) ?? initialModel;

  /**
   * Initial form values derived from current context settings.
   */
  const initialValues = {
    model: initialModel,
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={initialValues}
      onFinish={(vals) => {
        const model = (vals.model ?? "transformer") as ModelKind;
        setSettings({ model, model_variant: defaultVariantForModel(model) });
        onClose?.();
      }}
    >
      <Typography.Paragraph type="secondary">
        Estos ajustes se aplican por defecto a todas las extracciones.
      </Typography.Paragraph>

      <Form.Item label="Modelo" name="model" rules={[{ required: true }]}>
        <Select options={MODEL_OPTIONS} />
      </Form.Item>

      {watchedModel === "llm" && <LlmPrivacyAlert className="mb-4" />}

      <Space style={{ marginTop: 8 }}>
        <Button onClick={() => form.resetFields()}>Restablecer</Button>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Space>
    </Form>
  );
}
