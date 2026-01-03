"use client";

/**
 * Application layout for the MedAI extraction interface.
 *
 * This layout wraps all pages within the (app) route group, providing the
 * main application shell with header, navigation controls, and slide-out
 * drawers for settings and entity reference.
 *
 * @remarks
 * **Layout Structure:**
 * - Header with logo, tagline, and action buttons
 * - Main content card with internal scrolling
 * - Settings drawer for model configuration
 * - Entities drawer for entity type reference
 *
 * **Responsive Design:**
 * The layout adapts to different screen sizes with responsive padding
 * and a maximum width constraint for optimal readability.
 *
 * @module app/(app)/layout
 */

import { useState } from "react";
import { Button, Drawer, Space, Tooltip, Typography, Card } from "antd";
import { SettingOutlined, TagsOutlined } from "@ant-design/icons";
import Image from "next/image";
import DrawerSetting from "@/components/settings/drawer-setting";
import DrawerEntities from "@/components/entities/drawer-entities";

/**
 * Application shell layout component.
 *
 * Provides the main application structure including header, content area,
 * and slide-out drawers for settings and entity reference. The layout
 * manages drawer visibility state and renders child pages within a
 * scrollable content card.
 *
 * @param props - Component props containing children to render.
 * @returns The application layout with header, content, and drawers.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [openConfig, setOpenConfig] = useState(false);
  const [openEntities, setOpenEntities] = useState(false);

  return (
    <>
      <main className="flex h-svh items-center justify-center overflow-hidden p-4 md:p-8">
        <section className="flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden xl:max-w-6xl">
          <header className="mb-4 flex items-baseline justify-between">
            <div className="space-y-1">
              <div className="flex items-end gap-2">
                <Image src="/icon.svg" alt="MedAI" width={32} height={32} />
                <span>
                  <Typography.Title level={3} className="!mb-0 !p-0 !leading-none">
                    MedAI
                  </Typography.Title>
                </span>
              </div>
              <Typography.Text type="secondary">
                Analiza notas clinicas y reportes para extraer <b>parametros ventilatorios</b> y
                otras variables clinicas relevantes.
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
          {/* Main content card: fills available height without forcing page scroll.
              - Scrolling occurs within the card content when overflow occurs.
              - Clean design with translucent background and subtle blur. */}
          <Card
            className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md backdrop-blur-sm"
            styles={{
              body: {
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                padding: 0 /* padding is handled by the inner wrapper */,
              },
            }}
          >
            <div className="p-4 sm:p-5 md:p-6 lg:p-8">{children}</div>
          </Card>
        </section>
      </main>
      <Drawer
        title="Ajustes de extraccion"
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
