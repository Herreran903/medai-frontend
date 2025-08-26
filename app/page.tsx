"use client";

import { useState } from "react";
import { Button, Card, Drawer, Space, Tabs, Typography, Tooltip, Tag } from "antd";
import { SettingOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";
import SingleUpload from "@/components/upload/single-upload";
import BatchUpload from "@/components/upload/batch-upload";
import DrawerSetting from "@/components/settings/drawer-setting";
import { Activity } from "lucide-react";

export default function Home() {
  const [openConfig, setOpenConfig] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-3xl">
        <header className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-cyan-700" />
              <Typography.Title level={3} className="!mb-0">
                MedAI
              </Typography.Title>
              <Tag color="cyan">Ventilación mecánica</Tag>
            </div>
            <Typography.Text type="secondary">
              Analiza notas clínicas y reportes para extraer <b>parámetros ventilatorios</b> y otras
              variables relevantes.
            </Typography.Text>
          </div>
          <Space>
            <Tooltip title="Ajustes de modelo">
              <Button
                icon={<SettingOutlined />}
                onClick={() => setOpenConfig(true)}
                aria-label="Abrir ajustes de modelo"
              />
            </Tooltip>
          </Space>
        </header>
        <Card className="w-full rounded-lg shadow-md">
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
        </Card>
      </section>

      <Drawer
        title="Ajustes de extracción"
        placement="right"
        width={380}
        open={openConfig}
        onClose={() => setOpenConfig(false)}
        destroyOnClose
      >
        <DrawerSetting onClose={() => setOpenConfig(false)} />
      </Drawer>
    </main>
  );
}
