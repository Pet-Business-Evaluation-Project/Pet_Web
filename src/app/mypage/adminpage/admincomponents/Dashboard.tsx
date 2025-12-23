"use client";

import React, { useState, useEffect } from "react";
import {
  FaChartLine,
  FaSyncAlt,
  FaCheck,
  FaLock,
  FaHistory,
} from "react-icons/fa";
import StatCards from "./Statcards";
import ExpenseSection from "./ExpenseSection";
import RevenueSection from "./RevenueSection";
import SettlementHistoryModal from "./SettlementHistoryModal";

interface DashboardStats {
  totalReviewers: number;
  totalCompanies: number;
  pendingReviews: number;
  chargeCost: number;
  inviteCost: number;
  referralCost: number;
  reviewCost: number;
  studyCost: number;
  totalCost: number;
}

interface SettlementDto {
  settlementId: number;
  year: number;
  month: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  chargeCost: number;
  inviteCost: number;
  referralCost: number;
  reviewCost: number;
  studyCost: number;
  settlementStatus: string;
  confirmedBy: string;
  confirmedAt: string;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviewers: 0,
    totalCompanies: 0,
    pendingReviews: 0,
    chargeCost: 0,
    inviteCost: 0,
    referralCost: 0,
    reviewCost: 0,
    studyCost: 0,
    totalCost: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [settlementDate, setSettlementDate] = useState<Date | null>(null);
  const [currentSettlement, setCurrentSettlement] =
    useState<SettlementDto | null>(null);
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 🆕 탭 상태 추가
  const [activeTab, setActiveTab] = useState<"revenue" | "expense">("expense");

  // Chrome 확장 프로그램 오류 방지
  useEffect(() => {
    const preventExtensionError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("message channel closed")) {
        event.preventDefault();
        console.warn("Chrome 확장 프로그램 오류 무시됨");
      }
    };

    window.addEventListener("error", preventExtensionError);
    return () => window.removeEventListener("error", preventExtensionError);
  }, []);

  useEffect(() => {
    fetchStats();
    calculateNextSettlementDate();
    checkCurrentMonthSettlement();
    fetchSettlementHistory();
  }, []);

  const calculateNextSettlementDate = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let nextSettlement = new Date(currentYear, currentMonth, 10);

    if (today.getDate() > 10) {
      nextSettlement = new Date(currentYear, currentMonth + 1, 10);
    }

    setSettlementDate(nextSettlement);
  };

  const getDaysUntilSettlement = (): number => {
    if (!settlementDate) return 0;
    const today = new Date();
    const diffTime = settlementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const checkCurrentMonthSettlement = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const response = await fetch(
        `https://www.kcci.co.kr/back/settlements/${year}/${month}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentSettlement(data);
      }
    } catch (error) {
      console.error("Failed to check current settlement:", error);
    }
  };

  const fetchSettlementHistory = async () => {
    try {
      const response = await fetch("https://www.kcci.co.kr/back/settlements", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSettlements(data);
      }
    } catch (error) {
      console.error("Failed to fetch settlement history:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://www.kcci.co.kr/back/admin/dashboard/all",
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalReviewers: data.totalReviewers || 0,
          totalCompanies: data.totalCompanies || 0,
          pendingReviews: data.pendingReviews || 0,
          chargeCost: data.chargeCost || 0,
          inviteCost: data.inviteCost || 0,
          referralCost: data.referralCost || 0,
          reviewCost: data.reviewCost || 0,
          studyCost: data.studyCost || 0,
          totalCost: data.totalCost || 0,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStats();
      await checkCurrentMonthSettlement();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSettlement = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    if (
      !confirm(
        `${year}년 ${month}월 정산을 생성하시겠습니까?\n\n현재 금액으로 스냅샷이 저장됩니다.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("https://www.kcci.co.kr/back/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ year, month }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSettlement(data);
        alert("정산이 생성되었습니다.");
        await fetchSettlementHistory();
      } else {
        const error = await response.text();
        alert(`정산 생성 실패: ${error}`);
      }
    } catch (error) {
      console.error("Failed to create settlement:", error);
      alert("정산 생성 중 오류가 발생했습니다.");
    }
  };

  const handleConfirmSettlement = async () => {
    if (!currentSettlement) return;

    const confirmedBy = prompt("확정자 이름을 입력하세요:");
    if (!confirmedBy) return;

    if (
      !confirm(
        `정산을 확정하시겠습니까?\n\n확정 후에는 수정할 수 없습니다.\n확정자: ${confirmedBy}`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `https://www.kcci.co.kr/back/settlements/${currentSettlement.settlementId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ confirmedBy }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentSettlement(data);
        alert("정산이 확정되었습니다.");
        await fetchSettlementHistory();
      } else {
        alert("정산 확정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to confirm settlement:", error);
      alert("정산 확정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSettlement = async (settlementId: number) => {
    if (!confirm("정산을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `https://www.kcci.co.kr/back/settlements/${settlementId}`,
        { method: "DELETE", credentials: "include" }
      );

      if (response.ok || response.status === 204) {
        alert("정산이 삭제되었습니다.");
        setCurrentSettlement(null);
        await fetchSettlementHistory();
      } else {
        alert("정산 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete settlement:", error);
      alert("정산 삭제 중 오류가 발생했습니다.");
    }
  };

  const daysUntilSettlement = getDaysUntilSettlement();

  return (
    <div className="flex-1 w-full">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-blue-500 w-7 h-7" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                관리자 대시보드
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                📅 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
                현황
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-500 text-white hover:bg-gray-600 shadow-md"
            >
              <FaHistory />
              정산 히스토리
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                refreshing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
              }`}
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "새로고침 중..." : "새로고침"}
            </button>

            {currentSettlement ? (
              currentSettlement.settlementStatus === "대기중" ? (
                <button
                  onClick={handleConfirmSettlement}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-green-500 text-white hover:bg-green-600 shadow-md"
                >
                  <FaCheck />
                  정산 확정
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  <FaLock />
                  정산 완료
                </button>
              )
            ) : (
              <button
                onClick={handleCreateSettlement}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-orange-500 text-white hover:bg-orange-600 shadow-md"
              >
                <FaCheck />
                정산 생성
              </button>
            )}
          </div>
        </div>

        {/* 정산 상태 카드 */}
        {currentSettlement && (
          <div
            className={`border-l-4 p-4 mb-6 rounded-lg ${
              currentSettlement.settlementStatus === "확정"
                ? "bg-green-50 border-green-400"
                : "bg-blue-50 border-blue-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {currentSettlement.year}년 {currentSettlement.month}월 정산 -{" "}
                  {currentSettlement.settlementStatus}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  총 금액: {currentSettlement.totalAmount.toLocaleString()}원 |
                  지급: {currentSettlement.paidAmount.toLocaleString()}원 |
                  미지급: {currentSettlement.unpaidAmount.toLocaleString()}원
                </p>
                {currentSettlement.confirmedBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    확정자: {currentSettlement.confirmedBy} |{" "}
                    {new Date(currentSettlement.confirmedAt).toLocaleString(
                      "ko-KR"
                    )}
                  </p>
                )}
              </div>
              {currentSettlement.settlementStatus === "대기중" && (
                <button
                  onClick={() =>
                    handleDeleteSettlement(currentSettlement.settlementId)
                  }
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        )}

        {/* 정산일 알림 */}
        {daysUntilSettlement <= 7 && daysUntilSettlement > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <p className="font-semibold text-yellow-800">
                  정산일이 {daysUntilSettlement}일 남았습니다
                </p>
                <p className="text-sm text-yellow-700">
                  {settlementDate?.toLocaleDateString("ko-KR")}까지 최종 금액을
                  확인해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <StatCards stats={stats} loading={loading} />

        {/* 🆕 탭 버튼 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
              activeTab === "expense"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            💸 지출 현황
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
              activeTab === "revenue"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            💰 수익 현황
          </button>
        </div>

        {/* 탭에 따른 섹션 표시 */}
        {activeTab === "expense" ? (
          <ExpenseSection lastRefreshTime={lastRefreshTime} />
        ) : (
          <RevenueSection lastRefreshTime={lastRefreshTime} />
        )}

        {/* 정산 히스토리 모달 */}
        <SettlementHistoryModal
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          settlements={settlements}
        />
      </div>
    </div>
  );
}
