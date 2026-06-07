import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FieldFlow PDF",
  description: "Edit structured PDFs like challans, fee slips, and invoices with linked field editing and PDF export.",
};

import { ThemeManager } from "@/components/ThemeManager";
import { ToastContainer } from "@/components/ToastContainer";
import { DynamicTitle } from "@/components/DynamicTitle";
import { ClerkProvider } from "@clerk/nextjs";
import { LOCAL_STORAGE_THEME_KEY } from "@/constants";
import { UserSyncManager } from "@/components/UserSyncManager";
import { ReferralTracker } from "@/components/ReferralTracker";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var savedTheme = localStorage.getItem('${LOCAL_STORAGE_THEME_KEY}');
            if (savedTheme === 'false') {
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
            }
          } catch (e) {}
        ` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink antialiased">
        <ClerkProvider>
          <ThemeManager />
          <ToastContainer />
          <DynamicTitle />
          <UserSyncManager />
          <Suspense fallback={null}>
            <ReferralTracker />
          </Suspense>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

