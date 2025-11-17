"use client";

import { useState } from "react";
import Image from "next/image";
import { FaUserCircle } from "react-icons/fa";
import Button from "../../components/Button/Button";
import { Dashboard, ReviewerDashboard, MemberDashboard } from "./admincomponents";

type ViewType = "main" | "reviewer" | "member" | "dashboard";

export default function AdminPage() {
  const [currentView, setCurrentView] = useState<ViewType>("main");

  const admin = {
    name: "관리자",
    grade: "Admin",
    avatar: "/img/profile.png",
  };

  // 각 뷰 렌더링
  const renderContent = () => {
    switch (currentView) {
      case "reviewer":
        return <ReviewerDashboard />;
      case "member":
        return <MemberDashboard />;
      case "dashboard":
        return <Dashboard />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-lg">좌측 메뉴에서 관리 항목을 선택해주세요.</p>
          </div>
        );
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 관리자 프로필 & 네비게이션 */}
      <div className="flex flex-col items-center md:items-start w-full md:w-64 bg-blue-100 rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0">
        {/* 프로필 섹션 */}
        <div className="w-24 h-24 rounded-full border-4 border-blue-500 relative overflow-hidden">
          {admin.avatar ? (
            <Image
              src={admin.avatar}
              alt="관리자 프로필"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <FaUserCircle className="w-full h-full text-gray-400" />
          )}
        </div>
        <p className="text-lg font-semibold text-center md:text-left">{admin.name}</p>
        <p className="text-gray-600 text-center md:text-left">{admin.grade}</p>

        {/* 구분선 */}
        <div className="w-full border-t border-blue-300 my-2"></div>

        {/* 네비게이션 버튼들 */}
        <div className="w-full flex flex-col gap-3">
          <Button
            label="관리자 대시보드"
            onClick={() => setCurrentView("dashboard")}
            className={`w-full ${
              currentView === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          />
          <Button
            label="심사원 관리"
            onClick={() => setCurrentView("reviewer")}
            className={`w-full ${
              currentView === "reviewer"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          />
          <Button
            label="기업 관리"
            onClick={() => setCurrentView("member")}
            className={`w-full ${
              currentView === "member"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          />
        </div>
      </div>

      {/* 우측 컨텐츠 영역 */}
      {renderContent()}
    </main>
  );
}