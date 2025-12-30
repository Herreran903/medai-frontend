"use client";

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

function systemLink(system: string, code: string): string | null {
  const s = (system || "").toUpperCase();
  if (s === "RXNORM") return `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(code)}`;
  if (s.startsWith("SNOMED"))
    return `https://browser.ihtsdotools.org/?perspective=full&conceptId=${encodeURIComponent(code)}`;
  if (s === "ICD10CM") return `https://icd.codes/icd10cm/${encodeURIComponent(code)}`;
  return null;
}

function CodesList({ codes }: { codes?: Code[] }) {
  if (!codes?.length) return <Typography.Text type="secondary">Sin códigos</Typography.Text>;
  return (
    <Space direction="vertical" size={4}>
      {codes.map((c, idx) => {
        const url = systemLink(c.system, c.code);
        return (
          <Space key={`${c.system}-${c.code}-${idx}`} size={6} wrap>
            <Badge color="blue" text={<strong>{c.system}</strong>} />
            {c.display && <Typography.Text>{c.display}</Typography.Text>}
            {typeof c.score === "number" && (
              <Typography.Text type="secondary">· score {c.score.toFixed(2)}</Typography.Text>
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

function getMaxNormalizatedCode(e: Entity): Code | null {
  if (!e?.codes?.length && !e?.code) return null;
  const list = e.codes?.length ? e.codes : [{ system: "—", code: e.code || "" }];
  return list.reduce(
    (max, c) => (c.score && (!max.score || c.score > max.score) ? c : max),
    list[0]
  );
}

function CodeTooltip({ e }: { e: Entity }) {
  let code = "Sin normalización";

  const top = getMaxNormalizatedCode(e);
  code = top?.display || top?.code || "Sin normalización";
  return <span className="capitalize">{code}</span>;
}

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

export default function EntityResult({ data }: { data: ExtractResponse }) {
  const entitiesByType = useMemo(() => {
    const groups: Record<string, Entity[]> = {};
    for (const e of data.entities || []) {
      (groups[e.type] ||= []).push(e);
    }
    return groups;
  }, [data.entities]);

  const types = useMemo(() => Object.keys(entitiesByType).sort(), [entitiesByType]);

  const [systemFilter, setSystemFilter] = useState<string | "ALL">("ALL");

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
      title: "Normalización",
      key: "codes",
      render: (e: Entity) => <CodesList codes={e.codes} />,
    },
  ];

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
              label: "Normalización",
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
                      No hay entidades con códigos normalizados.
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
