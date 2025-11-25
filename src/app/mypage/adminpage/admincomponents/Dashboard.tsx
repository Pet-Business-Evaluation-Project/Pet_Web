"use client";

import React, { useState, useEffect } from "react";
import {
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaClipboardCheck,
  FaChevronDown,
  FaChevronUp,
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

// ✅ 차트용 데이터 타입 추가
interface ChartData {
  name: string;
  지급: number;
  미지급: number;
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

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [costDetails, setCostDetails] = useState<Record<string, CostDetail[]>>(
    {}
  );
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://www.kcci.co.kr/back/admin/dashboard/all",
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
          `https://www.kcci.co.kr/back/costs/${type}/payment-statistics`,
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

  const fetchCostDetails = async (costType: string) => {
    if (detailsLoading[costType]) return;

    try {
      setDetailsLoading({ ...detailsLoading, [costType]: true });

      const response = await fetch(
        `https://www.kcci.co.kr/back/costs/${costType}/with-status`,
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
        `https://www.kcci.co.kr/back/costs/${costType}/${id}/payment-status`,
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

  // ✅ 차트 데이터 생성 함수
  const getChartData = (): ChartData[] => {
    return paymentData.map((item) => ({
      name: item.name,
      지급: item.paidAmount,
      미지급: item.unpaidAmount,
    }));
  };

  // ✅ 필터링된 데이터
  const getFilteredPaymentData = () => {
    if (activePaymentTab === "paid") {
      return paymentData.filter((item) => item.paidAmount > 0);
    } else if (activePaymentTab === "unpaid") {
      return paymentData.filter((item) => item.unpaidAmount > 0);
    }
    return paymentData;
  };

  // ✅ 총계 계산
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
        <div className="flex items-center gap-3 mb-8">
          <FaChartLine className="text-blue-500 w-7 h-7" />
          <h2 className="text-2xl font-bold text-gray-800">관리자 대시보드</h2>
        </div>

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

            {/* ✅ 총계 표시 */}
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

          {/* ✅ 스택형 바 차트 */}
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

          {/* 테이블 */}
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
      </div>
    </div>
  );
}
