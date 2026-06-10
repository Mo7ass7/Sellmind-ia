import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellmind IA — إشارات التداول",
  description: "أداة تحليل تقني تجمع 5 مؤشرات لإعطاء إشارة شراء أو بيع دقيقة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
