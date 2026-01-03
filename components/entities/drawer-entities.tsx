"use client";

/**
 * Entity legend drawer component for the MedAI frontend.
 *
 * This module provides a collapsible reference panel that displays all
 * recognized clinical entity types with their associated colors and
 * descriptions. It serves as a legend to help clinicians interpret
 * highlighted entities in extraction results.
 *
 * @remarks
 * The component dynamically generates its content from the {@link ENTITY_INFO}
 * constant, ensuring the legend stays synchronized with the entity type
 * definitions used throughout the application.
 *
 * @example
 * ```tsx
 * import DrawerEntities from "@/components/entities/drawer-entities";
 *
 * function Sidebar() {
 *   return (
 *     <aside>
 *       <DrawerEntities />
 *     </aside>
 *   );
 * }
 * ```
 *
 * @module drawer-entities
 */

import { Collapse, Tag, Typography } from "antd";
import { TagsOutlined } from "@ant-design/icons";
import React from "react";
import { ENTITY_INFO } from "@/constants/entities";

/**
 * Collapsible drawer panel displaying all recognized clinical entity types.
 *
 * This component renders a reference legend that helps clinicians understand
 * the meaning of highlighted entities in extraction results. Each entity type
 * is displayed with its color indicator and can be expanded to show a detailed
 * clinical description.
 *
 * @remarks
 * **Visual Design:**
 * - Each entity type shows a color swatch matching the highlight color used
 *   in extraction results
 * - Entity labels are displayed in bold for quick scanning
 * - Descriptions are hidden by default and revealed on expansion to reduce
 *   visual clutter
 *
 * **Usage Context:**
 * This component is typically placed in a sidebar or drawer alongside the
 * extraction results view. It provides contextual help without requiring
 * users to navigate away from their current workflow.
 *
 * **Client-Only Behavior:**
 * This component uses the "use client" directive as it relies on Ant Design
 * components that require browser APIs for collapse animations.
 *
 * @returns A React element containing the entity legend with collapsible sections.
 *
 * @example
 * ```tsx
 * // In a results page layout
 * function ResultsLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <div className="flex">
 *       <main className="flex-1">{children}</main>
 *       <aside className="w-80">
 *         <DrawerEntities />
 *       </aside>
 *     </div>
 *   );
 * }
 * ```
 */
export default function DrawerEntities() {
  /**
   * Transforms ENTITY_INFO into Ant Design Collapse items.
   * Each item displays the entity color, label, and expandable description.
   */
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
