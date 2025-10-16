// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer/Footer";
import Mainpage from "@/components/Mainpage/Mainpage";

export const metadata: Metadata = {
  title: "Next App",
  description: "Next.js 기본 구조 설명",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // css도 지저분하게 해도되고 따로 파일만들어서 해도되는데 후자를 추천하긴합니다 css 이름 다르게 해야됨
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <header className="p-4 bg-gray-800 text-white text-center">
          <h1>페이지의 공통인 부분을 잡아주는것 레이아웃</h1>
          <h4> 메타데이터 위에부분은 신경 ㄴㄴ 안써도됨</h4>
          <h2> 헤더 부분</h2>
        </header>

        <main className="flex-1 p-8">
          {children}  {/* 여기 children 은 무엇일까요 */}
          
          <Mainpage/>
        </main>
  {/* 이렇게 쓰게되면 footer.tsx를 불러오는것 위에 import 경로 확인하기 */}
        <Footer /> 
      </body>
    </html>
  );
}
