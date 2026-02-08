"use client";

/**
 * Single-case upload component for the MedAI frontend.
 *
 * This module provides the primary interface for processing individual clinical
 * notes through the MedAI extraction pipeline. It supports both direct text input
 * and file uploads, collecting required metadata before submitting to the Backend API.
 *
 * @remarks
 * **Workflow:**
 * 1. User enters episode ID and note date/time
 * 2. User provides clinical text OR uploads a document file (mutually exclusive)
 * 3. Form validates inputs and builds FormData with model settings
 * 4. Request is sent to the Backend API extraction endpoint
 * 5. On success, user is redirected to the results page
 *
 * **Supported File Types:**
 * - Plain text (.txt)
 * - PDF documents (.pdf)
 * - Microsoft Word (.doc, .docx)
 *
 * @example
 * ```tsx
 * import SingleUpload from "@/components/upload/single-upload";
 *
 * function ExtractionPage() {
 *   return (
 *     <div className="max-w-2xl mx-auto">
 *       <h1>Extract Entities</h1>
 *       <SingleUpload />
 *     </div>
 *   );
 * }
 * ```
 *
 * @module single-upload
 */

import { useState, useMemo } from "react";
import { Button, Form, Input, Upload, Space, Typography, DatePicker, Row, Col } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Dragger } = Upload;
import { extractEntities } from "@/lib/api";
import { useModelSettings } from "../providers/model-settings-provider";
import type { UploadFile, UploadChangeParam } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { notify } from "@/lib/notifications";
import { toUserMessage } from "@/lib/http";

/**
 * Allowed MIME types for clinical note uploads.
 *
 * This set defines the file types that can be processed by the Backend API.
 * Files with MIME types not in this list will be rejected during upload.
 *
 * @internal
 */
const ALLOWED_MIME = new Set<string>([
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Allowed file extensions as a fallback when MIME type is unavailable.
 *
 * Some browsers do not reliably provide MIME types for all file formats.
 * This set provides a secondary validation based on file extension.
 *
 * @internal
 */
const ALLOWED_EXT = new Set<string>([".txt", ".pdf", ".doc", ".docx"]);

/**
 * Validates a filename against the allowed extension list.
 *
 * Used as a fallback when the browser does not provide a reliable MIME type.
 * The check is case-insensitive.
 *
 * @param filename - The filename to validate.
 * @returns True if the file has an allowed extension.
 *
 * @internal
 */
function hasAllowedExtension(filename?: string): boolean {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return Array.from(ALLOWED_EXT).some((ext) => lower.endsWith(ext));
}

/**
 * Normalizes any error into a user-facing message.
 *
 * Delegates to {@link toUserMessage} for consistent error messaging
 * across the application.
 *
 * @param err - The error to normalize.
 * @returns A user-friendly error message string.
 *
 * @internal
 */
function getErrorMessage(err: unknown): string {
  return toUserMessage(err);
}

/**
 * Form values for the single extraction workflow.
 *
 * Represents the data collected from the user before submitting
 * an extraction request to the Backend API.
 */
type FormValues = {
  /**
   * Episode or encounter identifier.
   *
   * A clinical identifier linking the note to a specific patient encounter.
   * This value is stored with the extraction results for audit and retrieval.
   */
  episodio: string;

  /**
   * Note date and time.
   *
   * The timestamp associated with the clinical note, typically representing
   * when the note was authored or when the clinical encounter occurred.
   */
  fecha: Dayjs;

  /**
   * Raw clinical text content.
   *
   * The clinical note text pasted directly into the form. Mutually exclusive
   * with file upload — only one input method can be used per submission.
   */
  texto?: string;

  /**
   * Uploaded file list.
   *
   * Contains at most one file when the user chooses file upload instead of
   * text input. Mutually exclusive with the texto field.
   */
  file?: UploadFile[];
};

/**
 * Single-case extraction form component.
 *
 * This component provides the primary interface for processing individual clinical
 * notes through the MedAI extraction pipeline. It collects note metadata (episode ID,
 * date/time), accepts either text input or file upload, and submits the extraction
 * request to the Backend API.
 *
 * @remarks
 * **Input Modes:**
 * Text and file inputs are mutually exclusive to match the Backend API contract.
 * When the user starts typing, file upload is disabled; when a file is uploaded,
 * the text area is disabled. This prevents ambiguous submissions.
 *
 * **Model Settings:**
 * The component reads model configuration from the {@link ModelSettingsProvider}
 * context and includes all settings (model, variant, normalization parameters)
 * in the extraction request.
 *
 * **Navigation:**
 * On successful extraction, the user is automatically redirected to the results
 * page using the note ID returned by the Backend API.
 *
 * @returns A React element containing the single-case extraction form.
 *
 * @example
 * ```tsx
 * // In a page component
 * export default function ExtractPage() {
 *   return (
 *     <div className="container">
 *       <h1>Extract Entities from Clinical Note</h1>
 *       <SingleUpload />
 *     </div>
 *   );
 * }
 * ```
 */
export default function SingleUpload() {
  const { settings } = useModelSettings();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const texto = Form.useWatch<string>("texto", form);
  const watchedFiles = Form.useWatch<UploadFile[]>("file", form);
  const fileList = useMemo<UploadFile[]>(() => watchedFiles ?? [], [watchedFiles]);
  const modelLabel =
    settings.model === "lstm" ? "BiLSTM-CRF" : settings.model === "llm" ? "LLM" : "Transformer";

  /**
   * Normalizes the file list from upload events.
   * @internal
   */
  const normFile = (e: UploadChangeParam<UploadFile> | UploadFile[] | undefined): UploadFile[] => {
    if (Array.isArray(e)) return e;
    return e?.fileList ?? [];
  };

  /**
   * Validates files before upload and rejects unsupported types.
   * @internal
   */
  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isMimeOk = file.type ? ALLOWED_MIME.has(file.type) : true;
    const isExtOk = hasAllowedExtension(file.name);
    if (!isMimeOk && !isExtOk) {
      notify.error("Tipo de archivo no permitido. Usa TXT, PDF o DOC/DOCX.");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  /**
   * Determines if the current file selection is valid for submission.
   */
  const hasValidFile = useMemo(() => {
    if (!fileList.length) return false;
    const f = fileList[0].originFileObj;
    if (!f) return false;
    const typeOk = f.type ? ALLOWED_MIME.has(f.type) : true;
    const extOk = hasAllowedExtension(f.name);
    return Boolean(typeOk || extOk);
  }, [fileList]);

  /**
   * Determines if the text input contains valid content.
   */
  const hasText = useMemo(() => Boolean(texto && texto.trim().length > 0), [texto]);

  const textDisabled = hasValidFile;
  const uploadDisabled = hasText;
  const canSubmit = (hasText && !hasValidFile) || (hasValidFile && !hasText);

  /**
   * Clears file selection when user starts typing.
   * @internal
   */
  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v && v.trim().length > 0 && fileList.length) {
      form.setFieldsValue({ file: [] });
    }
  };

  /**
   * Clears text input when user uploads a file.
   * @internal
   */
  const onUploadChange: UploadProps["onChange"] = ({ fileList: fl }) => {
    form.setFieldsValue({ file: fl as UploadFile[] });
    if (fl.length > 0 && hasText) {
      form.setFieldsValue({ texto: "" });
    }
  };

  /**
   * Handles form submission and extraction request.
   * @internal
   */
  const onSubmit = async (values: FormValues) => {
    const canSubmitNow =
      (values.texto && values.texto.trim().length > 0 && !(values.file?.length ?? 0)) ||
      (values.file?.length === 1 && !(values.texto && values.texto.trim().length > 0));

    if (!canSubmitNow) {
      notify.info("Proporciona texto o un archivo valido (solo uno).");
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

      /* Note metadata required by the Backend API. */
      fd.append("episode_id", String(values.episodio).trim());
      fd.append("note_date", values.fecha.toDate().toISOString());

      /* Model configuration and normalization flags. */
      fd.append("model", settings.model);
      /* Optional model variant, when supported by the backend. */
      if (typeof settings.model_variant === "string" && settings.model_variant.trim().length > 0) {
        fd.append("model_variant", settings.model_variant.trim());
      }
      // Normalizacion deshabilitada temporalmente; se deja la logica como referencia.
      // fd.append("normalize", String(settings.normalize));

      /* Locked vocabularies and entity types defined by the provider. */
      // if (settings.systems?.length) {
      //   fd.append("systems_csv", settings.systems.join(","));
      // }
      // if (settings.restrict_types?.length) {
      //   fd.append("restrict_types_csv", settings.restrict_types.join(","));
      // }

      /* Linking thresholds are included to align with batch behavior. */
      // if (typeof settings.min_link_score === "number") {
      //   fd.append("min_link_score", settings.min_link_score.toString());
      // }
      // if (typeof settings.max_candidates === "number") {
      //   fd.append("max_candidates", settings.max_candidates.toString());
      // }

      const ack = await extractEntities(fd);

      if (!ack?.id) {
        notify.info("La extraccion no devolvio un ID.");
        return;
      }
      if (!ack.stored) {
        notify.info("La nota no se guardo (save=false o politica de almacenamiento).");
      }

      const url = `/results/${ack.id}`;
      window.location.assign(url);
    } catch (e: unknown) {
      const isFieldsError =
        typeof e === "object" && e !== null && "errorFields" in e && Array.isArray(e.errorFields);
      if (isFieldsError) {
        notify.error("Completa el numero de episodio y la fecha.");
      } else {
        notify.error(getErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form layout="vertical" form={form} onFinish={onSubmit} className="relative">
        <LoadingOverlay show={loading} text="Procesando extracción…" />
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Numero de episodio"
              name="episodio"
              rules={[{ required: true, message: "Ingresa el numero de episodio" }]}
            >
              <Input placeholder="Ej: 110006-168633 (o el ID numerico)" />
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
                ? "Deshabilitado porque se subio un archivo"
                : "Pega la nota clinica aqui…"
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
          extra="Solo se permiten archivos TXT, PDF o DOC/DOCX. Maximo 1 archivo."
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
            Iniciar extracción
          </Button>
          <Typography.Text type="secondary" className="capitalize">
            Modelo actual: <b>{modelLabel}</b>
            {/*
              Variante oculta en UI (se fuerza en el provider):
              - transformer -> roberta
              - llm -> gpt
            */}
          </Typography.Text>
        </Space>
      </Form>
    </div>
  );
}
