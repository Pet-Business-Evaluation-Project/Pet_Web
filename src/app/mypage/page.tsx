"use client";

import { useRouter } from "next/navigation";
import Button from "../components/Button/Button";

export default function MyPage() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 space-y-8">
      <h1 className="text-3xl font-bold">권한 선택</h1>
      <p className="text-gray-600 text-center">
        테스트용으로 버튼을 클릭하면 각 페이지로 이동합니다.
      </p>

      <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
        {/* 관리자 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full md:w-64 flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-lg font-bold">
            A
          </div>
          <h2 className="text-xl font-bold">관리자</h2>
          <p className="text-gray-500 text-center">
            시스템 관리 및 통계 확인 가능
          </p>
          <Button
            label="관리자 페이지로 이동"
            onClick={() => router.push("/mypage/adminpage")}
          />
        </div>

        {/* 리뷰어 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full md:w-64 flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 text-lg font-bold">
            R
          </div>
          <h2 className="text-xl font-bold">리뷰어</h2>
          <p className="text-gray-500 text-center">
            프로필 확인 및 나의 조직 관리 가능
          </p>
          <Button
            label="리뷰어 페이지로 이동"
            onClick={() => router.push("/mypage/reviewerpage")}
          />
        </div>
      </div>
    </main>
  );
}