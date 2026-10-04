import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Help'Em — Barangay Quiling Emergency Resilience Network",
  description:
    "Real-time crisis coordination, verified emergency updates, and neighborhood mutual aid for Barangay Quiling and local communities.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-brand-green-deep antialiased selection:bg-brand-green-deep selection:text-white overflow-x-hidden min-w-[320px] w-full">
        {children}
      </body>
    </html>
  );
}
