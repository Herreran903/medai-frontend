"use client";

import { Card, Space, Tag, Typography, Descriptions, Tabs, Collapse } from "antd";
import React, { useMemo } from "react";
import { getEntityColor } from "@/constants/entities";

type Entity = { type: string; text: string; start: number; end: number; code?: string };
type ResultData = { text?: string; entities?: Entity[]; meta?: any };

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
    chunks.push(
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

export default function EntityResult({ data }: { data: ResultData }) {
  const entitiesByType = useMemo(() => {
    const groups: Record<string, Entity[]> = {};
    for (const e of data.entities || []) {
      (groups[e.type] ||= []).push(e);
    }
    return groups;
  }, [data.entities]);

  const types = useMemo(() => Object.keys(entitiesByType).sort(), [entitiesByType]);

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
      <Card bodyStyle={{ padding: 16 }} style={{ width: "100%" }}>
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
                      No se recibió el texto original. Asegúrate de incluirlo en la respuesta (campo{" "}
                      <code>text</code>) o de guardarlo en el provider.
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
                                  {e.code ? ` · ${e.code}` : ""}
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
              label: "Metadatos de extracción",
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
