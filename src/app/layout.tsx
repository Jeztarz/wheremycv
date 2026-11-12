import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "wheremycv",
  description: "จดว่าส่ง CV ไปที่ไหน ใครตอบกลับแล้วบ้าง",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f6f8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={plexThai.variable}>
      <body className="font-sans antialiased">
        <div className="mx-auto min-h-dvh max-w-[480px]">{children}</div>
      </body>
    </html>
  );
}
