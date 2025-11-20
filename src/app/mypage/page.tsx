"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userStr = localStorage.getItem("user");

    if (!userStr) {
      alert("로그인이 필요합니다.");
      router.replace("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      // 세션 만료 체크
      if (user.expiresAt && Date.now() >= user.expiresAt) {
        localStorage.removeItem("user");
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        router.replace("/");
        return;
      }

      // 권한에 따라 페이지 이동
      if (user.classification === "관리자") {
        router.replace("/mypage/adminpage");
      } else if (user.classification === "심사원") {
        router.replace("/mypage/reviewerpage");
      } else if (user.classification === "기업") {
        router.replace("/mypage/companypage");
      } else {
        alert("접근 권한이 없습니다.");
        router.replace("/");
      }
    } catch (e) {
      console.error("로그인 정보 파싱 실패:", e);
      localStorage.removeItem("user");
      router.replace("/");
    }
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-800">권한 확인 중...</h1>
      <p className="text-gray-600 mt-2">잠시만 기다려 주세요.</p>
    </main>
  );
}