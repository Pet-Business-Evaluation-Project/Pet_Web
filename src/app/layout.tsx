import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Button from "./components/Button/Button";
import Modal from "./components/Modal/Modal";
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