"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR 방지

    const userStr = localStorage.getItem("user");

    if (!userStr) {
      console.warn("로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
      router.replace("/login"); // 로그인 페이지로 리다이렉트
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log("로그인 정보:", user);

      const classification = user.classification; // "관리자" 또는 "심사원"
      
      if (!classification) {
        console.warn("classification 값이 없습니다:", classification);
        router.replace("/login");
        return;
      }

      if (classification === "관리자") {
        router.replace("/mypage/adminpage");
      } else if (classification === "심사원") {
        router.replace("/mypage/reviewerpage");
      } else {
        alert("기업 페이지는 없어용. 초기 페이지로 이동합니다.");
        router.replace("/"); // 권한 이상 시 로그인 페이지
      }
    } catch (e) {
      console.error("로그인 정보 파싱 실패:", e, "로그인 페이지로 이동합니다.");
      router.replace("/"); // 파싱 실패 시 로그인 페이지
    }
  }, [router]);

  // 잠시 로딩 화면
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold">권한 확인 중...</h1>
      <p className="text-gray-600 mt-4">잠시만 기다려 주세요.</p>
    </main>
  );
}

