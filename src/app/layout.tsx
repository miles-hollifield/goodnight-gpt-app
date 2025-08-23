import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProviderWrapper } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoodnightGPT - Scholarship Assistant",
  description: "AI-powered scholarship search and assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProviderWrapper>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
