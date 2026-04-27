"use client";

/**
 * Entity extraction results display component for the MedAI frontend.
 *
 * This module provides the primary interface for reviewing clinical entity
 * extraction results. It displays highlighted text with inline entity markers,
 * grouped entity lists, and backend metadata for audit-oriented review.
 *
 * @remarks
 * **Key Features:**
 * - Highlighted text view with color-coded entity markers
 * - Grouped entity list organized by entity type
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

import { Card, Space, Tag, Typography, Descriptions, Tabs, Collapse } from "antd";
import React, { useMemo } from "react";
import { getEntityColor } from "@/constants/entities";
import { Entity, ExtractResponse } from "@/lib/types";

/**
 * Props for the {@link EntityResult} component.
 */
type EntityResultProps = {
  /**
   * Extraction payload containing text, entities, and metadata.
   *
   * The complete response from the Backend API extraction endpoint,
   * including the original clinical text, extracted entities with
   * offsets and normalized values, and backend metadata.
   */
  data: ExtractResponse;
};

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

  const sorted = [...entities].sort((a, b) => {
    const aStart = a.start ?? Number.MAX_SAFE_INTEGER;
    const bStart = b.start ?? Number.MAX_SAFE_INTEGER;
    const aEnd = a.end ?? aStart;
    const bEnd = b.end ?? bStart;
    return aStart - bStart || bEnd - bStart - (aEnd - aStart);
  });

  const chunks: React.ReactNode[] = [];
  let cursor = 0;

  for (const ent of sorted) {
    const start = ent.start ?? NaN;
    const end = ent.end ?? NaN;
    const { type } = ent;
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
 * Primary results view for extracted entities.
 *
 * This component consolidates text highlights, entity lists, and metadata
 * into a single clinical review surface. It currently provides two viewing
 * modes: highlighted text and grouped entity list.
 *
 * @remarks
 * **Tab Views:**
 * 1. **Highlighted Text** — Original note with color-coded entity markers
 * 2. **Entity List** — Entities grouped by type in expandable cards
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
                      No se recibio el texto original. Asegurate de incluirlo en la respuesta (campo{" "}
                      <code>text</code>) o de que el proveedor lo almacene.
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
