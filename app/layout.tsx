import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GIM Bazaar",
  description: "Campus marketplace for GIM students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-20">{children}</main>
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
