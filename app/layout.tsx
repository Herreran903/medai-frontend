/**
 * Root layout for the MedAI frontend application.
 *
 * This module defines the top-level HTML structure, global providers, and
 * theme configuration for the entire application. It wraps all pages with
 * the necessary context providers and Ant Design configuration.
 *
 * @remarks
 * **Provider Hierarchy:**
 * 1. ConfigProvider — Ant Design theme and locale configuration
 * 2. ModelSettingsProvider — Global extraction model settings
 * 3. AntdRegistry — Server-side rendering support for Ant Design
 *
 * **Theme Configuration:**
 * The Ant Design theme is customized with a cyan/teal primary color palette
 * suitable for medical applications, with carefully selected semantic colors
 * for success, warning, and error states.
 *
 * @module app/layout
 */

import "@ant-design/v5-patch-for-react-19";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "antd/dist/reset.css";
import "./globals.css";
import { ConfigProvider, theme as antdTheme } from "antd";
import esES from "antd/locale/es_ES";
import { ModelSettingsProvider } from "@/components/providers/model-settings-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";

/**
 * Geist Sans font configuration for body text.
 */
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

/**
 * Geist Mono font configuration for code and monospace text.
 */
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/**
 * Application metadata for SEO and social sharing.
 *
 * Defines the default page title, description, keywords, and Open Graph
 * metadata used across the application.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "MedAI · Extraccion de entidades clinicas",
    template: "%s · MedAI",
  },
  description:
    "Analiza notas clinicas para extraer parametros ventilatorios y variables relacionadas usando NER basado en IA.",
  applicationName: "MedAI",
  authors: [{ name: "MedAI" }],
  keywords: [
    "medicina",
    "IA clinica",
    "ventilacion mecanica",
    "parametros ventilatorios",
    "notas clinicas",
    "procesamiento de lenguaje natural",
    "reconocimiento de entidades",
    "NER",
    "salud",
  ],
  icons: {
    icon: "/icon.ico",
    shortcut: "/icon.ico",
  },
  openGraph: {
    title: "MedAI · Extraccion de entidades clinicas",
    description:
      "Analiza notas clinicas para extraer parametros ventilatorios y variables relacionadas usando NER basado en IA.",
    url: "/",
    siteName: "MedAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedAI · Extraccion de entidades clinicas",
    description:
      "Analiza notas clinicas para extraer parametros ventilatorios y variables relacionadas usando NER basado en IA.",
  },
};

/**
 * Root layout component wrapping all pages.
 *
 * Provides the HTML document structure, global CSS variables, and context
 * providers required by all pages in the application.
 *
 * @param props - Component props containing children to render.
 * @returns The complete HTML document structure.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-50`}
      >
        <ConfigProvider
          locale={esES}
          theme={{
            algorithm: antdTheme.defaultAlgorithm,
            token: {
              colorPrimary: "#0e7490",
              colorInfo: "#0e7490",
              colorSuccess: "#22c55e",
              colorWarning: "#f59e0b",
              colorError: "#e11d48",
              colorBgLayout: "#f9fafb",
              colorBgContainer: "#ffffff",
              colorBorder: "#e5e7eb",
              colorText: "#111827",
              colorTextSecondary: "#6b7280",
              colorTextHeading: "#0f172a",
              borderRadius: 10,
              fontSize: 14,
              fontFamily:
                "var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            },
            components: {
              Layout: { bodyBg: "#f9fafb" },
              Card: {
                headerBg: "#ffffff",
                paddingLG: 20,
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.04), 0 1px 3px rgba(0,0,0,0.06)",
              },
              Tag: { defaultBg: "#ecfeff", defaultColor: "#0e7490" },
              Tabs: { itemSelectedColor: "#0e7490", inkBarColor: "#0e7490" },
              Upload: { colorBorder: "#94a3b8" },
              Drawer: { colorBgElevated: "#ffffff" },
              Button: { controlHeight: 36 },
            },
          }}
        >
          <ModelSettingsProvider>
            <AntdRegistry>{children}</AntdRegistry>
          </ModelSettingsProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
