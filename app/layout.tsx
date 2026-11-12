import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "أكاديمية الغريب | حضور اللاعبين والمدربين",
  description:
    "نظام أكاديمية الغريب: تسجيل حضور اللاعبين والمدربين بالباركود وإدارة الاشتراكات والتقارير.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>{children}</body>
    </html>
  );
}
