import "@ant-design/v5-patch-for-react-19";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "antd/dist/reset.css";
import "./globals.css";
import { ConfigProvider, theme as antdTheme } from "antd";
import esES from "antd/locale/es_ES";
import { ModelSettingsProvider } from "@/components/providers/model-settings-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "MedAI · Ventilación mecánica",
    template: "%s · MedAI",
  },
  description:
    "Analiza notas clínicas para extraer parámetros ventilatorios y variables relacionadas.",
  applicationName: "MedAI",
  authors: [{ name: "MedAI" }],
  keywords: [
    "medicina",
    "IA clínica",
    "ventilación mecánica",
    "parámetros ventilatorios",
    "historias clínicas",
    "procesamiento de lenguaje natural",
  ],
  icons: {
    icon: "/icon.ico",
    shortcut: "/icon.ico",
  },
  openGraph: {
    title: "MedAI · Ventilación mecánica",
    description:
      "Analiza notas clínicas para extraer parámetros ventilatorios y variables relacionadas.",
    url: "/",
    siteName: "MedAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedAI · Ventilación mecánica",
    description:
      "Analiza notas clínicas para extraer parámetros ventilatorios y variables relacionadas.",
  },
};

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
