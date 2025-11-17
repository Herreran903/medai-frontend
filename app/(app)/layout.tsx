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
      <main className="flex h-svh items-center justify-center overflow-hidden p-4 md:p-8">
        <section className="flex h-full w-full max-w-5xl flex-col overflow-hidden xl:max-w-6xl">
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
          {/* Tarjeta principal: ocupar alto disponible sin forzar scroll de la página.
              - El scroll ocurre dentro del contenido de la tarjeta cuando hay desborde.
              - Diseño sobrio con fondo claro translúcido y leve blur. */}
          <Card className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md backdrop-blur-sm">
            <div className="h-full overflow-auto p-4 sm:p-5 md:p-6 lg:p-8">{children}</div>
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
