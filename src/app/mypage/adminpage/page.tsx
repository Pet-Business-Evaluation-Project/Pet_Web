"use client";

import { useState } from "react";
import Image from "next/image";
import { FaUserCircle, FaTachometerAlt, FaUserTie, FaBuilding } from "react-icons/fa";
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
            <div className="text-center">
              <FaTachometerAlt className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">좌측 메뉴에서 관리 항목을 선택해주세요.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 관리자 프로필 & 네비게이션 */}
      <aside className="w-full md:w-72 bg-white rounded-2xl shadow-lg p-6 flex-shrink-0">
        {/* 관리자 프로필 */}
        <div className="flex flex-col items-center pb-6 border-b border-gray-200">
          <div className="w-20 h-20 rounded-full border-4 border-blue-500 relative overflow-hidden mb-3">
            {admin.avatar ? (
              <Image
                src={admin.avatar}
                alt="관리자 프로필"
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-400" />
            )}
          </div>
          <p className="text-lg font-bold text-gray-800">{admin.name}</p>
          <p className="text-sm text-gray-500">{admin.grade}</p>
        </div>

        {/* 메뉴 */}
        <nav className="mt-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              관리 메뉴
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  currentView === "dashboard"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaTachometerAlt className="w-5 h-5" />
                <span>관리자 대시보드</span>
              </button>
              <button
                onClick={() => setCurrentView("reviewer")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  currentView === "reviewer"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaUserTie className="w-5 h-5" />
                <span>심사원 관리</span>
              </button>
              <button
                onClick={() => setCurrentView("member")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  currentView === "member"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaBuilding className="w-5 h-5" />
                <span>기업 관리</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* 우측 컨텐츠 영역 */}
      {renderContent()}
    </main>
  );
}