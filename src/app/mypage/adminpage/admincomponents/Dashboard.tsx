"use client";

import React, { useState, useEffect } from "react";
import {
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaClipboardCheck,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaSyncAlt,
  FaCheck,
  FaLock,
  FaHistory,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface PaymentData {
  name: string;
  value: number;
  status: "지급" | "미지급";
  costType: string;
  paidAmount: number;
  unpaidAmount: number;
}

interface CostDetail {
  id: number;
  userId: number;
  userName: string;
  cost: number;
  paymentStatus: "지급" | "미지급";
  createdat: string;
}

interface PaymentStatistics {
  costType: string;
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalAmount: number;
}

interface ChartData {
  name: string;
  지급: number;
  미지급: number;
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

  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [activePaymentTab, setActivePaymentTab] = useState<
    "all" | "paid" | "unpaid"
  >("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [costDetails, setCostDetails] = useState<Record<string, CostDetail[]>>(
    {}
  );
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>(
    {}
  );

  // 정산 관련 상태
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [settlementDate, setSettlementDate] = useState<Date | null>(null);
  const [currentSettlement, setCurrentSettlement] =
    useState<SettlementDto | null>(null);
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  // 이번 달 정산 확인
  const checkCurrentMonthSettlement = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const response = await fetch(
        `http://petback.hysu.kr/back/settlements/${year}/${month}`,
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

  // 정산 히스토리 조회
  const fetchSettlementHistory = async () => {
    try {
      const response = await fetch("http://petback.hysu.kr/back/settlements", {
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

  // 정산 생성
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
      const response = await fetch("http://petback.hysu.kr/back/settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  // 정산 확정
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
        `http://petback.hysu.kr/back/settlements/${currentSettlement.settlementId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

  // 정산 삭제
  const handleDeleteSettlement = async (settlementId: number) => {
    if (!confirm("정산을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/settlements/${settlementId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
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

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://petback.hysu.kr/back/admin/dashboard/all",
        {
          credentials: "include",
        }
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

        await fetchPaymentStatistics();
      } else {
        console.error("Failed to fetch stats");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatistics = async () => {
    try {
      const costTypes = [
        { type: "charge", name: "영업비" },
        { type: "review", name: "심사비" },
        { type: "invite", name: "수수료" },
        { type: "study", name: "강사비" },
        { type: "referral", name: "추천비" },
      ];

      const statisticsPromises = costTypes.map(async ({ type, name }) => {
        const response = await fetch(
          `http://petback.hysu.kr/back/costs/${type}/payment-statistics`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data: PaymentStatistics = await response.json();
          return {
            name,
            value: data.totalAmount,
            status:
              data.unpaidAmount > 0 ? ("미지급" as const) : ("지급" as const),
            costType: type,
            paidAmount: data.paidAmount,
            unpaidAmount: data.unpaidAmount,
          };
        }
        return null;
      });

      const results = await Promise.all(statisticsPromises);
      const validResults = results.filter((r) => r !== null) as PaymentData[];
      setPaymentData(validResults);
    } catch (error) {
      console.error("Failed to fetch payment statistics:", error);
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

  const fetchCostDetails = async (costType: string) => {
    if (detailsLoading[costType]) return;

    try {
      setDetailsLoading({ ...detailsLoading, [costType]: true });

      const response = await fetch(
        `http://petback.hysu.kr/back/costs/${costType}/with-status`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setCostDetails({ ...costDetails, [costType]: data.costs });
      }
    } catch (error) {
      console.error(`Failed to fetch ${costType} details:`, error);
    } finally {
      setDetailsLoading({ ...detailsLoading, [costType]: false });
    }
  };

  const handleItemClick = (costType: string) => {
    if (expandedItem === costType) {
      setExpandedItem(null);
    } else {
      setExpandedItem(costType);
      if (!costDetails[costType]) {
        fetchCostDetails(costType);
      }
    }
  };

  const handlePaymentStatusChange = async (
    costType: string,
    id: number,
    newStatus: "지급" | "미지급"
  ) => {
    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/costs/${costType}/${id}/payment-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ paymentStatus: newStatus }),
        }
      );

      if (response.ok) {
        await fetchCostDetails(costType);
        await fetchPaymentStatistics();
      }
    } catch (error) {
      console.error("Failed to update payment status:", error);
    }
  };

  const handleDeleteCost = async (
    costType: string,
    id: number,
    userName: string
  ) => {
    if (!confirm(`${userName}의 비용 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/costs/${costType}/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok || response.status === 204) {
        alert("삭제되었습니다.");
        await fetchCostDetails(costType);
        await fetchPaymentStatistics();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete cost:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const getChartData = (): ChartData[] => {
    return paymentData.map((item) => ({
      name: item.name,
      지급: item.paidAmount,
      미지급: item.unpaidAmount,
    }));
  };

  const getFilteredPaymentData = () => {
    if (activePaymentTab === "paid") {
      return paymentData.filter((item) => item.paidAmount > 0);
    } else if (activePaymentTab === "unpaid") {
      return paymentData.filter((item) => item.unpaidAmount > 0);
    }
    return paymentData;
  };

  const getTotalStats = () => {
    const totalPaid = paymentData.reduce(
      (sum, item) => sum + item.paidAmount,
      0
    );
    const totalUnpaid = paymentData.reduce(
      (sum, item) => sum + item.unpaidAmount,
      0
    );
    const total = totalPaid + totalUnpaid;

    return { totalPaid, totalUnpaid, total };
  };

  const filteredPaymentData = getFilteredPaymentData();
  const chartData = getChartData();
  const { totalPaid, totalUnpaid, total } = getTotalStats();
  const daysUntilSettlement = getDaysUntilSettlement();

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
          {loading ? (
            <div className="mt-2 h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
          )}
        </div>
        <Icon className={`w-12 h-12 ${color.replace("border-", "text-")}`} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-blue-500 w-7 h-7" />
            <h2 className="text-2xl font-bold text-gray-800">
              관리자 대시보드
            </h2>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            {/* 정산 히스토리 버튼 */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-500 text-white hover:bg-gray-600 shadow-md"
            >
              <FaHistory />
              정산 히스토리
            </button>

            {/* 새로고침 버튼 */}
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

            {/* 정산 버튼 */}
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
                  <FaTrash />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 정산일 알림 */}
        {daysUntilSettlement <= 7 && daysUntilSettlement > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
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

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* 지급 필요 금액 섹션 */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-orange-500 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-800">
                지급 필요 금액
              </h3>
            </div>

            <div className="flex items-center gap-6">
              {lastRefreshTime && (
                <div className="text-xs text-gray-500">
                  마지막 업데이트: {lastRefreshTime.toLocaleTimeString("ko-KR")}
                </div>
              )}

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-600">총 지출: </span>
                  <span className="font-bold text-gray-900">
                    {total.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-green-600">지급 완료: </span>
                  <span className="font-bold text-green-700">
                    {totalPaid.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-red-600">미지급: </span>
                  <span className="font-bold text-red-700">
                    {totalUnpaid.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActivePaymentTab("all")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activePaymentTab === "all"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActivePaymentTab("paid")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activePaymentTab === "paid"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              지급
            </button>
            <button
              onClick={() => setActivePaymentTab("unpaid")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activePaymentTab === "unpaid"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              미지급
            </button>
          </div>

          {/* 스택형 바 차트 */}
          <div className="bg-white rounded-lg p-6 mb-6">
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-gray-400">데이터를 불러오는 중...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString()}원`}
                  />
                  <Legend />
                  <Bar
                    dataKey="지급"
                    stackId="a"
                    fill="#10B981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="미지급"
                    stackId="a"
                    fill="#EF4444"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ✅ 테이블 - 원래 있던 부분 */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">
                      항목
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">
                      총 금액
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">
                      지급 완료
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">
                      미지급
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-400"
                      >
                        데이터를 불러오는 중...
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredPaymentData.map((item, index) => (
                        <React.Fragment key={`${item.costType}-${index}`}>
                          {/* 메인 행 */}
                          <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6 font-medium text-gray-800">
                              {item.name}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-gray-900">
                              {item.value.toLocaleString()}원
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-green-700 font-semibold">
                                {item.paidAmount.toLocaleString()}원
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-red-700 font-semibold">
                                {item.unpaidAmount.toLocaleString()}원
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleItemClick(item.costType)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {expandedItem === item.costType ? (
                                  <FaChevronUp className="inline" />
                                ) : (
                                  <FaChevronDown className="inline" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* 확장된 상세 정보 */}
                          {expandedItem === item.costType && (
                            <tr>
                              <td colSpan={5} className="bg-gray-50 p-4">
                                {detailsLoading[item.costType] ? (
                                  <div className="text-center py-4 text-gray-400">
                                    로딩 중...
                                  </div>
                                ) : (
                                  <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                            사용자
                                          </th>
                                          <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                            금액
                                          </th>
                                          <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                            생성일
                                          </th>
                                          <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                            지급 상태
                                          </th>
                                          <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                            삭제
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {costDetails[item.costType]?.map(
                                          (detail) => (
                                            <tr
                                              key={detail.id}
                                              className="border-b border-gray-200 hover:bg-gray-100"
                                            >
                                              <td className="py-2 px-4 text-sm">
                                                {detail.userName} (ID:{" "}
                                                {detail.userId})
                                              </td>
                                              <td className="py-2 px-4 text-sm text-right">
                                                {detail.cost.toLocaleString()}원
                                              </td>
                                              <td className="py-2 px-4 text-sm text-center">
                                                {new Date(
                                                  detail.createdat
                                                ).toLocaleDateString("ko-KR")}
                                              </td>
                                              <td className="py-2 px-4 text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={
                                                      detail.paymentStatus ===
                                                      "지급"
                                                    }
                                                    onChange={(e) =>
                                                      handlePaymentStatusChange(
                                                        item.costType,
                                                        detail.id,
                                                        e.target.checked
                                                          ? "지급"
                                                          : "미지급"
                                                      )
                                                    }
                                                    className="sr-only peer"
                                                  />
                                                  <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                  <span className="ml-3 text-sm font-medium text-gray-700">
                                                    {detail.paymentStatus}
                                                  </span>
                                                </label>
                                              </td>
                                              <td className="py-2 px-4 text-center">
                                                <button
                                                  onClick={() =>
                                                    handleDeleteCost(
                                                      item.costType,
                                                      detail.id,
                                                      detail.userName
                                                    )
                                                  }
                                                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                  title="삭제"
                                                >
                                                  <FaTrash className="inline" />
                                                </button>
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td className="py-4 px-6 font-bold text-gray-900">
                          합계
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900 text-lg">
                          {total.toLocaleString()}원
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-green-700 text-lg">
                          {totalPaid.toLocaleString()}원
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-red-700 text-lg">
                          {totalUnpaid.toLocaleString()}원
                        </td>
                        <td></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* 안내 문구 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-right">
                * 매월 말일 마감 후 익월 10일 지급
              </p>
            </div>
          </div>
        </div>

        {/* 정산 히스토리 모달 */}
        {showHistoryModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">정산 히스토리</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {settlements.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    정산 내역이 없습니다.
                  </p>
                ) : (
                  settlements.map((settlement) => (
                    <div
                      key={settlement.settlementId}
                      className={`border rounded-lg p-4 ${
                        settlement.settlementStatus === "확정"
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {settlement.year}년 {settlement.month}월 -{" "}
                            {settlement.settlementStatus}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            총액: {settlement.totalAmount.toLocaleString()}원 |
                            지급: {settlement.paidAmount.toLocaleString()}원 |
                            미지급: {settlement.unpaidAmount.toLocaleString()}원
                          </p>
                          {settlement.confirmedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              확정자: {settlement.confirmedBy} |{" "}
                              {new Date(settlement.confirmedAt).toLocaleString(
                                "ko-KR"
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            생성:{" "}
                            {new Date(settlement.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
