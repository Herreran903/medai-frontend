"use client";

/**
 * Home page for the MedAI extraction interface.
 *
 * This page provides the main entry point for clinical entity extraction,
 * offering two workflow modes: single-case extraction for individual notes
 * and batch upload for processing multiple files simultaneously.
 *
 * @remarks
 * **Workflow Modes:**
 * - **Single Case** — Process one clinical note at a time with immediate results
 * - **Batch Upload** — Process multiple files in a single request with status tracking
 *
 * The page uses a tabbed interface to switch between modes while preserving
 * form state within each tab.
 *
 * @module app/(app)/page
 */

import { Tabs } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import SingleUpload from "@/components/upload/single-upload";
import BatchUpload from "@/components/upload/batch-upload";

/**
 * Home page component with extraction workflow tabs.
 *
 * Renders a tabbed interface allowing users to choose between single-case
 * and batch extraction workflows. Each tab contains the appropriate upload
 * component for that workflow mode.
 *
 * @returns A React element containing the tabbed extraction interface.
 */
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
              <TeamOutlined /> Carga multiple
            </span>
          ),
          children: <BatchUpload />,
        },
      ]}
    />
  );
}
