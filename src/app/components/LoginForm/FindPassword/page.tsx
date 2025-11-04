"use client";

import { useRouter } from "next/navigation";
import React from "react"; // React 임포트

export default function FindPassword() {
  // Next.js의 클라이언트 측 라우팅을 위한 훅
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-12">비밀번호 찾기</h1>

      <div className="flex gap-8">
        {/* 1. 심사원 비밀번호 찾기 버튼 */}
        <button
          onClick={() => router.push("/components/LoginForm/FindPassword/FindreviewerPassword")} 
          className="bg-gray-300 hover:bg-gray-400 text-lg font-medium px-12 py-6 rounded shadow transition duration-150"
        >
          심사원 비밀번호 찾기
        </button>

        {/* 2. 판매 기업 비밀번호 찾기 버튼 */}
        <button
          // router.push()를 사용하여 지정된 경로로 이동
          onClick={() => router.push("/components/LoginForm/FindPassword/FindmemberPassword")}
          className="bg-gray-300 hover:bg-gray-400 text-lg font-medium px-12 py-6 rounded shadow transition duration-150"
        >
          기업 비밀번호 찾기
        </button>
      </div>
    </div>
  );
}