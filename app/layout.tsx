import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { ProfileEnsurer } from "@/components/ProfileEnsurer";
import { MixpanelProvider } from "@/components/MixpanelProvider";

const inter = Inter({ subsets: ["latin"] });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  style: ["normal"],
});

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
      <body className={`${inter.className} ${fraunces.variable}`}>
        <ClerkProvider>
          <MixpanelProvider />
          <ProfileEnsurer />
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
