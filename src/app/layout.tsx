import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aha · A little more insight",
  description:
    "Spend five minutes a day exploring ideas that help you understand yourself, connect with others, and navigate life more thoughtfully.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf6ef",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
