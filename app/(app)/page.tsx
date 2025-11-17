"use client";

import { Tabs } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import SingleUpload from "@/components/upload/single-upload";
import BatchUpload from "@/components/upload/batch-upload";

export default function Home() {
  return (
    <Tabs
      defaultActiveKey="single"
      items={[
        {
          key: "single",
          label: (
            <span>
              <UserOutlined /> Caso individual
            </span>
          ),
          children: <SingleUpload />,
        },
        {
          key: "batch",
          label: (
            <span>
              <TeamOutlined /> Carga múltiple
            </span>
          ),
          children: <BatchUpload />,
        },
      ]}
    />
  );
}
