import type { Metadata } from "next";
import "./globals.css";
import Header from "./componets/Header/Header";
import Footer from "./componets/Footer/Footer";
import { ReactNode } from "react";



export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-green-50">{children}</main>
        <Footer />
      </body>
    </html>
  );
}