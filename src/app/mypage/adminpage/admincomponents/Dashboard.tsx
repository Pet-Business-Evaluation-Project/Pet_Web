"use client";

import { useState, useEffect } from "react";
import { FaChartLine, FaUsers, FaBuilding, FaClipboardCheck } from "react-icons/fa";

interface DashboardStats {
  totalReviewers: number;
  totalCompanies: number;
  pendingReviews: number;
  completedReviews: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviewers: 0,
    totalCompanies: 0,
    pendingReviews: 0,
    completedReviews: 0,
  });

  // TODO: 백엔드에서 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 여기에 통계 데이터 API 호출 로직 추가
        // const res = await fetch("http://www.kcci.co.kr/back/mypage/admin/stats", {
        //   method: "GET",
        //   credentials: "include",
        // });
        // if (res.ok) {
        //   const data = await res.json();
        //   setStats(data);
        // }
        
        // 임시 데이터
        setStats({
          totalReviewers: 24,
          totalCompanies: 156,
          pendingReviews: 8,
          completedReviews: 342,
        });
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: number;
    color: string;
  }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <Icon className={`w-12 h-12 ${color.replace("border-", "text-")}`} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 max-w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <FaChartLine className="text-blue-500 w-6 h-6" />
          <h2 className="text-xl font-bold">관리자 대시보드</h2>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaUsers}
            title="전체 심사원"
            value={stats.totalReviewers}
            color="border-blue-500"
          />
          <StatCard
            icon={FaBuilding}
            title="전체 기업"
            value={stats.totalCompanies}
            color="border-green-500"
          />
          <StatCard
            icon={FaClipboardCheck}
            title="대기 중인 심사"
            value={stats.pendingReviews}
            color="border-yellow-500"
          />
          <StatCard
            icon={FaClipboardCheck}
            title="완료된 심사"
            value={stats.completedReviews}
            color="border-purple-500"
          />
        </div>

        {/* 최근 활동 섹션 */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
          <div className="space-y-3">
            {/* TODO: 실제 최근 활동 데이터로 교체 */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">새로운 심사원 등록</p>
                <p className="text-sm text-gray-500">홍길동 - 심사원보</p>
              </div>
              <span className="text-xs text-gray-400">2시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">기업 심사 완료</p>
                <p className="text-sm text-gray-500">(주)샘플기업 - 승인</p>
              </div>
              <span className="text-xs text-gray-400">5시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">직책 변경</p>
                <p className="text-sm text-gray-500">김철수 - 심사위원 → 수석심사위원</p>
              </div>
              <span className="text-xs text-gray-400">1일 전</span>
            </div>
          </div>
        </div>

        {/* TODO: 차트 및 추가 통계 정보 추가 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 이곳에 추가 통계 차트나 그래프를 추가할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}