import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import "../styles/developer-theme.css";
import { HeaderProvider } from "@/components/providers/header-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Developer Community",
  description: "개발자 커뮤니티 - AI 뉴스, 기술 트렌드, 부트캠프 협업 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-destructive">
                  애플리케이션 오류
                </h1>
                <p className="text-muted-foreground">
                  페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                </p>
                <Link 
                  href="/"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            </div>
          }
        >
          <QueryProvider>
            <HeaderProvider />
            {children}
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
