"use client";

import { Card, Space, Tag, Typography, Descriptions } from "antd";

type Entity = { type: string; text: string; score?: number; code?: string };

export default function EntityResult({ data }: { data: { entities?: Entity[]; meta?: any } }) {
  const groups = (data.entities || []).reduce<Record<string, Entity[]>>((acc, e) => {
    (acc[e.type] ||= []).push(e);
    return acc;
  }, {});
  const types = Object.keys(groups).sort();

  return (
    <Space direction="vertical" className="w-full">
      {data.meta && (
        <Descriptions bordered size="small" column={1}>
          {Object.entries(data.meta).map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>
              {String(v)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}

      {types.map((t) => (
        <Card key={t} title={<Typography.Text strong>{t}</Typography.Text>}>
          <Space wrap>
            {groups[t].map((e, i) => (
              <Tag key={`${t}-${i}`}>
                {e.text}
                {typeof e.score === "number" ? ` (${e.score.toFixed(2)})` : ""}
                {e.code ? ` · ${e.code}` : ""}
              </Tag>
            ))}
          </Space>
        </Card>
      ))}

      {!types.length && (
        <Typography.Text type="secondary">No se encontraron entidades.</Typography.Text>
      )}
    </Space>
  );
}
