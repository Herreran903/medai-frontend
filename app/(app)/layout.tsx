"use client";

import { useState } from "react";
import { Button, Drawer, Space, Tooltip, Typography, Card } from "antd";
import { SettingOutlined, TagsOutlined } from "@ant-design/icons";
import { Activity } from "lucide-react";
import DrawerSetting from "@/components/settings/drawer-setting";
import DrawerEntities from "@/components/entities/drawer-entities";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [openConfig, setOpenConfig] = useState(false);
  const [openEntities, setOpenEntities] = useState(false);

  return (
    <>
      <main className="flex min-h-screen items-center justify-center p-6 md:p-8">
        <section className="w-full max-w-5xl xl:max-w-6xl">
          <header className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-cyan-700" />
                <Typography.Title level={3} className="!mb-0">
                  MedAI
                </Typography.Title>
              </div>
              <Typography.Text type="secondary">
                Analiza notas clínicas y reportes para extraer <b>parámetros ventilatorios</b> y
                otras variables relevantes.
              </Typography.Text>
            </div>
            <Space>
              <Tooltip title="Entidades reconocidas">
                <Button
                  icon={<TagsOutlined />}
                  onClick={() => setOpenEntities(true)}
                  aria-label="Mostrar entidades"
                />
              </Tooltip>
              <Tooltip title="Ajustes de modelo">
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setOpenConfig(true)}
                  aria-label="Abrir ajustes de modelo"
                />
              </Tooltip>
            </Space>
          </header>
          <Card className="w-full rounded-lg shadow-md" bodyStyle={{ padding: 24 }}>
            {children}
          </Card>
        </section>
      </main>
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
      <Drawer
        title="Entidades soportadas"
        placement="right"
        width={380}
        open={openEntities}
        onClose={() => setOpenEntities(false)}
        destroyOnClose
      >
        <DrawerEntities />
      </Drawer>
    </>
  );
}
