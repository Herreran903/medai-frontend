"use client";

/**
 * Entity extraction results display component for the MedAI frontend.
 *
 * This module provides the primary interface for reviewing clinical entity
 * extraction results. It displays highlighted text with inline entity markers,
 * grouped entity lists, and normalized code mappings with external reference links.
 *
 * @remarks
 * **Key Features:**
 * - Highlighted text view with color-coded entity markers
 * - Grouped entity list organized by entity type
 * - Normalization table with vocabulary system filtering
 * - External links to RxNorm, SNOMED CT, and ICD-10 browsers
 * - Copy-to-clipboard functionality for normalized codes
 * - Collapsible metadata panel for backend audit information
 *
 * @example
 * ```tsx
 * import EntityResult from "@/components/results/entity-result";
 *
 * function ResultsPage({ data }: { data: ExtractResponse }) {
 *   return (
 *     <div className="container">
 *       <h1>Extraction Results</h1>
 *       <EntityResult data={data} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @module entity-result
 */

import {
  Card,
  Space,
  Tag,
  Typography,
  Descriptions,
  Tabs,
  Collapse,
  Tooltip,
  Table,
  Button,
  Badge,
  Segmented,
  message,
} from "antd";
import React, { useMemo, useState } from "react";
import { getEntityColor } from "@/constants/entities";
import { CopyOutlined, LinkOutlined } from "@ant-design/icons";
import { Code, Entity, ExtractResponse } from "@/lib/types";

/**
 * Props for the {@link CodesList} component.
 */
type CodesListProps = {
  /**
   * Normalized codes attached to the entity.
   *
   * An array of {@link Code} objects representing vocabulary mappings
   * for the entity. May be empty or undefined if normalization was
   * not performed or no matches were found.
   */
  codes?: Code[];
};

/**
 * Props for the {@link CodeTooltip} component.
 */
type CodeTooltipProps = {
  /**
   * Entity providing normalization metadata.
   *
   * The entity whose best normalized code will be displayed in the tooltip.
   */
  e: Entity;
};

/**
 * Props for the {@link EntityResult} component.
 */
type EntityResultProps = {
  /**
   * Extraction payload containing text, entities, and metadata.
   *
   * The complete response from the Backend API extraction endpoint,
   * including the original clinical text, extracted entities with
   * offsets and normalizations, and backend metadata.
   */
  data: ExtractResponse;
};

/**
 * Builds external reference links for known clinical vocabularies.
 *
 * Generates URLs to authoritative vocabulary browsers where clinicians
 * can validate normalization results and access additional concept details.
 *
 * @param system - The vocabulary system identifier (e.g., "RXNORM", "SNOMEDCT_US").
 * @param code - The code value within the vocabulary system.
 * @returns A URL string for the external browser, or null for unknown systems.
 *
 * @internal
 */
function systemLink(system: string, code: string): string | null {
  const s = (system || "").toUpperCase();
  if (s === "RXNORM") return `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(code)}`;
  if (s.startsWith("SNOMED"))
    return `https://browser.ihtsdotools.org/?perspective=full&conceptId=${encodeURIComponent(code)}`;
  if (s === "ICD10CM") return `https://icd.codes/icd10cm/${encodeURIComponent(code)}`;
  return null;
}

/**
 * Renders a list of normalized codes for a single entity.
 *
 * Displays each code with its vocabulary system, display label, confidence
 * score, and action buttons for copying and opening external references.
 * Supports clinical review and copy-paste workflows.
 *
 * @param props - Component props containing the codes array.
 * @returns A React element displaying the codes list.
 *
 * @internal
 */
function CodesList({ codes }: CodesListProps) {
  if (!codes?.length) return <Typography.Text type="secondary">Sin codigos</Typography.Text>;
  return (
    <Space direction="vertical" size={4}>
      {codes.map((c, idx) => {
        const url = systemLink(c.system, c.code);
        return (
          <Space key={`${c.system}-${c.code}-${idx}`} size={6} wrap>
            <Badge color="blue" text={<strong>{c.system}</strong>} />
            {c.display && <Typography.Text>{c.display}</Typography.Text>}
            {typeof c.score === "number" && (
              <Typography.Text type="secondary">· puntaje {c.score.toFixed(2)}</Typography.Text>
            )}
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(`${c.system}:${c.code}`);
                message.success("Copiado");
              }}
            />
            {url && (
              <Button
                size="small"
                type="link"
                icon={<LinkOutlined />}
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Abrir
              </Button>
            )}
          </Space>
        );
      })}
    </Space>
  );
}

/**
 * Selects the highest-confidence normalized code from an entity.
 *
 * When an entity has multiple normalized codes, this function returns
 * the one with the highest confidence score for display in compact
 * tooltips and summaries.
 *
 * @param e - The entity to extract the best code from.
 * @returns The highest-scoring Code object, or null if no codes exist.
 *
 * @internal
 */
function getMaxNormalizatedCode(e: Entity): Code | null {
  if (!e?.codes?.length && !e?.code) return null;
  const list = e.codes?.length ? e.codes : [{ system: "—", code: e.code || "" }];
  return list.reduce(
    (max, c) => (c.score && (!max.score || c.score > max.score) ? c : max),
    list[0]
  );
}

/**
 * Tooltip content showing the best normalized code for an entity.
 *
 * Displays a compact representation of the entity's normalization,
 * reducing visual noise while still exposing normalization context
 * on hover.
 *
 * @param props - Component props containing the entity.
 * @returns A React element with the tooltip content.
 *
 * @internal
 */
function CodeTooltip({ e }: CodeTooltipProps) {
  const top = getMaxNormalizatedCode(e);
  const code = top?.display || top?.code || "Sin normalizacion";
  return <span className="capitalize">{code}</span>;
}

/**
 * Builds a highlighted clinical note with inline entity markers.
 *
 * Processes the original clinical text and entity offsets to produce a
 * React element with color-coded highlights for each extracted entity.
 * The output preserves original spacing and line breaks for accurate
 * clinical review.
 *
 * @param text - The original clinical note text.
 * @param entities - Array of extracted entities with offset information.
 * @returns A React element with highlighted entity spans, or null if no text.
 *
 * @internal
 */
function buildHighlighted(text: string, entities: Entity[]) {
  if (!text) return null;
  if (!entities?.length) return <Typography.Text>{text}</Typography.Text>;

  const sorted = [...entities].sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
  );

  const chunks: React.ReactNode[] = [];
  let cursor = 0;

  for (const ent of sorted) {
    const { start, end, type } = ent;
    if (isNaN(start) || isNaN(end) || start < cursor || end <= start || end > text.length) continue;

    if (cursor < start) {
      chunks.push(<span key={`t-${cursor}`}>{text.slice(cursor, start)}</span>);
    }

    const color = getEntityColor(type);
    const mark = (
      <mark
        key={`e-${start}-${end}`}
        style={{
          backgroundColor: color + "33",
          border: `1px solid ${color}`,
          borderRadius: 6,
          padding: "0 2px",
        }}
        title={type}
      >
        {text.slice(start, end)}
      </mark>
    );

    const isNormalized = Boolean(ent.code || (ent.codes && ent.codes.length));

    if (isNormalized) {
      chunks.push(
        <Tooltip
          className="max-w-lg"
          key={`tt-${start}-${end}`}
          placement="top"
          title={<CodeTooltip e={ent} />}
          color={getEntityColor(type)}
        >
          {mark}
        </Tooltip>
      );
      cursor = end;
      continue;
    }

    chunks.push(mark);

    cursor = end;
  }

  if (cursor < text.length) {
    chunks.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return (
    <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
      {chunks}
    </Typography.Paragraph>
  );
}

/**
 * Primary results view for extracted entities and normalization.
 *
 * This component consolidates text highlights, entity lists, and metadata
 * into a single clinical review surface. It provides three viewing modes:
 * highlighted text, grouped entity list, and normalization table.
 *
 * @remarks
 * **Tab Views:**
 * 1. **Highlighted Text** — Original note with color-coded entity markers
 * 2. **Entity List** — Entities grouped by type in expandable cards
 * 3. **Normalization** — Table of normalized entities with vocabulary codes
 *
 * **Filtering:**
 * The normalization tab includes a vocabulary system filter allowing users
 * to focus on specific code systems (RxNorm, SNOMED CT, ICD-10-CM).
 *
 * **Metadata:**
 * Backend metadata is displayed in a collapsible panel for debugging and
 * audit purposes.
 *
 * @param props - Component props containing the extraction response data.
 * @returns A React element displaying the extraction results.
 *
 * @example
 * ```tsx
 * // In a results page
 * export default async function ResultsPage({ params }) {
 *   const data = await fetchNote(params.id);
 *   return <EntityResult data={data} />;
 * }
 * ```
 */
export default function EntityResult({ data }: EntityResultProps) {
  /**
   * Groups entities by type for the entity list view.
   */
  const entitiesByType = useMemo(() => {
    const groups: Record<string, Entity[]> = {};
    for (const e of data.entities || []) {
      (groups[e.type] ||= []).push(e);
    }
    return groups;
  }, [data.entities]);

  /**
   * Sorted list of unique entity types present in the results.
   */
  const types = useMemo(() => Object.keys(entitiesByType).sort(), [entitiesByType]);

  /**
   * Current vocabulary system filter for the normalization table.
   */
  const [systemFilter, setSystemFilter] = useState<string | "ALL">("ALL");

  /**
   * Legend showing all entity types with their colors.
   */
  const legend = (
    <Space wrap>
      {types.map((t) => {
        const color = getEntityColor(t);
        return (
          <Tag key={t} color={color + "33"} style={{ color: "#111827", borderColor: color }}>
            {t}
          </Tag>
        );
      })}
    </Space>
  );

  const metaEntries = Object.entries(data.meta ?? {});
  const hasMeta = metaEntries.length > 0;

  /**
   * Entities filtered by the selected vocabulary system.
   */
  const normalizedEntities = useMemo(() => {
    const all = (data.entities || []).filter((e) => (e.codes && e.codes.length) || e.code);
    if (systemFilter === "ALL") return all;
    return all
      .map((e) => ({
        ...e,
        codes: (e.codes || []).filter((c) => c.system?.toUpperCase() === systemFilter),
      }))
      .filter((e) => (e.codes && e.codes.length) || e.code);
  }, [data.entities, systemFilter]);

  /**
   * Column definitions for the normalization table.
   */
  const columns = [
    {
      title: "Entidad",
      dataIndex: "text",
      key: "text",
      render: (text: string, e: Entity) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong className="capitalize">
            {text}
          </Typography.Text>
          <Tag
            color={getEntityColor(e.type) + "33"}
            style={{ color: "#111827", borderColor: getEntityColor(e.type) }}
          >
            {e.type}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Normalizacion",
      key: "codes",
      render: (e: Entity) => <CodesList codes={e.codes} />,
    },
  ];

  /**
   * Header with vocabulary system filter controls.
   */
  const normHeader = (
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <Typography.Text>Filtrar por sistema</Typography.Text>
      <Segmented
        value={systemFilter}
        onChange={(val) => setSystemFilter(val)}
        options={[
          { label: "Todos", value: "ALL" },
          { label: "RxNorm", value: "RXNORM" },
          { label: "SNOMED", value: "SNOMEDCT_US" },
          { label: "ICD-10-CM", value: "ICD10CM" },
        ]}
      />
    </Space>
  );

  return (
    <Space direction="vertical" className="w-full">
      <Card styles={{ body: { padding: 16 } }} style={{ width: "100%" }}>
        <Tabs
          defaultActiveKey="text"
          items={[
            {
              key: "text",
              label: "Texto resaltado",
              children: (
                <div style={{ maxHeight: 420, overflow: "auto" }}>
                  {legend}
                  <div style={{ height: 8 }} />
                  {data.text ? (
                    buildHighlighted(data.text, (data.entities || []) as Entity[])
                  ) : (
                    <Typography.Text type="secondary">
                      No se recibio el texto original. Asegurate de incluirlo en la respuesta
                      (campo <code>text</code>) o de que el proveedor lo almacene.
                    </Typography.Text>
                  )}
                </div>
              ),
            },
            {
              key: "list",
              label: "Lista de entidades",
              children: (
                <div style={{ maxHeight: 420, overflow: "auto" }}>
                  {types.length === 0 ? (
                    <Typography.Text type="secondary">No se encontraron entidades.</Typography.Text>
                  ) : (
                    <Space direction="vertical" className="w-full">
                      {types.map((t) => {
                        const color = getEntityColor(t);
                        return (
                          <Card
                            key={t}
                            size="small"
                            title={
                              <span>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10,
                                    height: 10,
                                    background: color,
                                    borderRadius: 2,
                                    marginRight: 8,
                                  }}
                                />
                                <Typography.Text strong>{t}</Typography.Text>
                              </span>
                            }
                          >
                            <Space wrap>
                              {entitiesByType[t].map((e, i) => (
                                <Tag
                                  key={`${t}-${i}`}
                                  color={color + "33"}
                                  style={{ color: "#111827", borderColor: color }}
                                >
                                  {e.text}
                                </Tag>
                              ))}
                            </Space>
                          </Card>
                        );
                      })}
                    </Space>
                  )}
                </div>
              ),
            },
            {
              key: "norm",
              label: "Normalizacion",
              children: (
                <div style={{ maxHeight: 420, overflow: "auto" }}>
                  <div style={{ marginBottom: 8 }}>{normHeader}</div>
                  <Table
                    size="small"
                    rowKey={(e) => `${e.type}-${e.start}-${e.end}-${e.text}`}
                    dataSource={normalizedEntities}
                    columns={columns}
                    pagination={{ pageSize: 6, size: "small", hideOnSinglePage: true }}
                  />
                  {normalizedEntities.length === 0 && (
                    <Typography.Text type="secondary">
                      No hay entidades con codigos normalizados.
                    </Typography.Text>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {hasMeta && (
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: "meta",
              label: "Metadatos de extraccion",
              children: (
                <Descriptions bordered size="small" column={1}>
                  {metaEntries.map(([k, v]) => (
                    <Descriptions.Item key={k} label={k}>
                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ),
            },
          ]}
        />
      )}
    </Space>
  );
}
