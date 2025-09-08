import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zip Procurement System",
  description: "Simple procurement system for interview demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
