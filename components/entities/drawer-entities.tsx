"use client";

import { Collapse, Tag, Typography } from "antd";
import { TagsOutlined } from "@ant-design/icons";
import React from "react";
import { ENTITY_INFO } from "@/constants/entities";

export default function DrawerEntities() {
  const items = Object.entries(ENTITY_INFO).map(([name, info]) => ({
    key: name,
    label: (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            background: info.color + "33",
            border: `1px solid ${info.color}`,
            borderRadius: 3,
            flex: "0 0 auto",
          }}
        />
        <Typography.Text strong>{name}</Typography.Text>
      </span>
    ),
    children: (
      <Typography.Paragraph style={{ marginBottom: 0 }}>{info.description}</Typography.Paragraph>
    ),
  }));

  return (
    <div className="flex flex-col gap-4">
      <Tag
        icon={<TagsOutlined />}
        style={{
          width: "100%",
          fontWeight: 600,
          padding: "12px 12px",
          fontSize: 14,
        }}
      >
        Entidades reconocidas
      </Tag>
      <Collapse items={items} />
    </div>
  );
}
