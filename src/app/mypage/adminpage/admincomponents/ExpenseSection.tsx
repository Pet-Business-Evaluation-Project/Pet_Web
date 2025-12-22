"use client";

import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaTrash, FaCheck } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CostDetail {
  id: number;
  userId: number;
  userName: string;
  cost: number;
  paymentStatus: "지급" | "미지급";
  createdat: string;
  bankName: string;
  accountNumber: string;
  referredUserId?: number;
  referredUserName?: string;
}

interface PaymentData {
  name: string;
  value: number;
  status: "지급" | "미지급";
  costType: string;
  paidAmount: number;
  unpaidAmount: number;
}

interface ReferralSummaryItem {
  userId: number;
  userName: string;
  loginId: string;
  totalReferralCost: number;
  referralCount: number;
  paidAmount: number;
  unpaidAmount: number;
  lastCreatedAt: string;
  bankName: string;
  accountNumber: string;
}

interface ReferralSummary {
  costs: ReferralSummaryItem[];
  totalAmount: number;
  totalUsers: number;
  totalReferralCount: number;
}

interface ExpenseSectionProps {
  lastRefreshTime: Date | null;
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다.");
    }
    throw error;
  }
};

export default function ExpenseSection({
  lastRefreshTime,
}: ExpenseSectionProps) {
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [activePaymentTab, setActivePaymentTab] = useState<
    "all" | "paid" | "unpaid"
  >("all");
  const [loading, setLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [costDetails, setCostDetails] = useState<Record<string, CostDetail[]>>(
    {}
  );
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [referralSummary, setReferralSummary] =
    useState<ReferralSummary | null>(null);
  const [expandedReferralUser, setExpandedReferralUser] = useState<
    number | null
  >(null);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<
    Record<number, boolean>
  >({});

  // 금액 수정 상태
  const [editingCostId, setEditingCostId] = useState<number | null>(null);
  const [editingCostValue, setEditingCostValue] = useState<string>("");

  useEffect(() => {
    fetchReferralSummary();
  }, []);

  useEffect(() => {
    if (referralSummary) {
      fetchPaymentStatistics();
    }
  }, [referralSummary]);

  const fetchReferralSummary = async () => {
    try {
      const response = await fetch(
        "http://petback.hysu.kr/back/costs/referral/with-status",
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        let allReferrals: CostDetail[] = data.costs;

        // 현재 월의 비용만 필터링
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        allReferrals = allReferrals.filter((referral) => {
          const referralDate = new Date(referral.createdat);
          return (
            referralDate.getFullYear() === currentYear &&
            referralDate.getMonth() + 1 === currentMonth
          );
        });

        // userId별로 그룹핑하여 summary 계산
        const userMap = new Map<number, ReferralSummaryItem>();

        allReferrals.forEach((referral) => {
          if (!userMap.has(referral.userId)) {
            userMap.set(referral.userId, {
              userId: referral.userId,
              userName: referral.userName,
              loginId: "",
              totalReferralCost: 0,
              referralCount: 0,
              paidAmount: 0,
              unpaidAmount: 0,
              lastCreatedAt: referral.createdat,
              bankName: referral.bankName || "미등록",
              accountNumber: referral.accountNumber || "미등록",
            });
          }

          const userSummary = userMap.get(referral.userId)!;
          userSummary.totalReferralCost += referral.cost;
          userSummary.referralCount += 1;

          if (referral.paymentStatus === "지급") {
            userSummary.paidAmount += referral.cost;
          } else {
            userSummary.unpaidAmount += referral.cost;
          }

          if (
            new Date(referral.createdat) > new Date(userSummary.lastCreatedAt)
          ) {
            userSummary.lastCreatedAt = referral.createdat;
          }
        });

        const costs = Array.from(userMap.values());
        const totalAmount = costs.reduce(
          (sum, user) => sum + user.totalReferralCost,
          0
        );
        const totalUsers = costs.length;
        const totalReferralCount = costs.reduce(
          (sum, user) => sum + user.referralCount,
          0
        );

        setReferralSummary({
          costs,
          totalAmount,
          totalUsers,
          totalReferralCount,
        });
      }
    } catch (error) {
      console.error("Failed to fetch referral summary:", error);
    }
  };

  const fetchPaymentStatistics = async () => {
    try {
      setLoading(true);
      const costTypes = [
        { type: "charge", name: "영업비" },
        { type: "review", name: "심사비" },
        { type: "invite", name: "수수료" },
        { type: "study", name: "강사비" },
      ];

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const statisticsPromises = costTypes.map(async ({ type, name }) => {
        const response = await fetch(
          `http://petback.hysu.kr/back/costs/${type}/with-status`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          let costs: CostDetail[] = data.costs;

          costs = costs.filter((cost) => {
            const costDate = new Date(cost.createdat);
            return (
              costDate.getFullYear() === currentYear &&
              costDate.getMonth() + 1 === currentMonth
            );
          });

          let paidAmount = 0;
          let unpaidAmount = 0;

          costs.forEach((cost) => {
            if (cost.paymentStatus === "지급") {
              paidAmount += cost.cost;
            } else {
              unpaidAmount += cost.cost;
            }
          });

          const totalAmount = paidAmount + unpaidAmount;

          return {
            name,
            value: totalAmount,
            status: unpaidAmount > 0 ? ("미지급" as const) : ("지급" as const),
            costType: type,
            paidAmount,
            unpaidAmount,
          };
        }
        return null;
      });

      const results = await Promise.all(statisticsPromises);
      const validResults = results.filter((r) => r !== null) as PaymentData[];

      if (referralSummary) {
        const paidAmount = referralSummary.costs.reduce(
          (sum, user) => sum + user.paidAmount,
          0
        );
        const unpaidAmount = referralSummary.costs.reduce(
          (sum, user) => sum + user.unpaidAmount,
          0
        );

        validResults.push({
          name: "추천비",
          value: referralSummary.totalAmount,
          status: unpaidAmount > 0 ? "미지급" : "지급",
          costType: "referral",
          paidAmount,
          unpaidAmount,
        });
      }

      setPaymentData(validResults);
    } catch (error) {
      console.error("Failed to fetch payment statistics:", error);
    } finally {
      setLoading(false);
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
        let costs: CostDetail[] = data.costs;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        costs = costs.filter((cost) => {
          const costDate = new Date(cost.createdat);
          return (
            costDate.getFullYear() === currentYear &&
            costDate.getMonth() + 1 === currentMonth
          );
        });

        setCostDetails({ ...costDetails, [costType]: costs });
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

  const handleReferralUserClick = (userId: number) => {
    if (expandedReferralUser === userId) {
      setExpandedReferralUser(null);
    } else {
      setExpandedReferralUser(userId);
      if (!costDetails[`referral-${userId}`]) {
        fetchReferralDetails(userId);
      }
    }
  };

  const fetchReferralDetails = async (userId: number) => {
    try {
      setDetailsLoading({ ...detailsLoading, [`referral-${userId}`]: true });

      const response = await fetch(
        "http://petback.hysu.kr/back/costs/referral/with-status",
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        let userReferrals = data.costs.filter(
          (item: CostDetail) => item.userId === userId
        );

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        userReferrals = userReferrals.filter((referral: CostDetail) => {
          const referralDate = new Date(referral.createdat);
          return (
            referralDate.getFullYear() === currentYear &&
            referralDate.getMonth() + 1 === currentMonth
          );
        });

        setCostDetails({
          ...costDetails,
          [`referral-${userId}`]: userReferrals,
        });
      }
    } catch (error) {
      console.error(
        `Failed to fetch referral details for user ${userId}:`,
        error
      );
    } finally {
      setDetailsLoading({ ...detailsLoading, [`referral-${userId}`]: false });
    }
  };

  const handleStartEditCost = (id: number, currentCost: number) => {
    setEditingCostId(id);
    setEditingCostValue(currentCost.toString());
  };

  const handleCancelEditCost = () => {
    setEditingCostId(null);
    setEditingCostValue("");
  };

  const handleSaveCost = async (
    costType: string,
    id: number,
    userId: number
  ) => {
    const newCost = parseInt(editingCostValue);

    if (isNaN(newCost) || newCost < 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/costs/${costType}/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId, cost: newCost }),
        }
      );

      if (response.ok) {
        alert("금액이 수정되었습니다.");
        setEditingCostId(null);
        setEditingCostValue("");

        if (costType === "referral") {
          await fetchReferralSummary();
          if (expandedReferralUser) {
            await fetchReferralDetails(expandedReferralUser);
          }
        } else {
          await fetchCostDetails(costType);
        }
        await fetchPaymentStatistics();
      } else {
        throw new Error("수정 실패");
      }
    } catch (error) {
      console.error("금액 수정 실패:", error);
      alert("금액 수정에 실패했습니다.");
    }
  };

  const handlePaymentStatusChange = async (
    costType: string,
    id: number,
    newStatus: "지급" | "미지급"
  ) => {
    if (updatingPaymentStatus[id]) {
      console.warn("이미 처리 중인 요청입니다.");
      return;
    }

    setUpdatingPaymentStatus({ ...updatingPaymentStatus, [id]: true });

    const previousCostDetails = { ...costDetails };
    const previousReferralSummary = referralSummary
      ? { ...referralSummary }
      : null;

    try {
      // 낙관적 업데이트
      if (costType === "referral") {
        const key = `referral-${expandedReferralUser}`;
        if (costDetails[key]) {
          const updatedDetails = costDetails[key].map((item) =>
            item.id === id ? { ...item, paymentStatus: newStatus } : item
          );
          setCostDetails({ ...costDetails, [key]: updatedDetails });

          if (referralSummary && expandedReferralUser) {
            const updatedSummary = {
              ...referralSummary,
              costs: referralSummary.costs.map((user) => {
                if (user.userId === expandedReferralUser) {
                  let paidAmount = 0;
                  let unpaidAmount = 0;
                  updatedDetails.forEach((item) => {
                    if (item.paymentStatus === "지급") {
                      paidAmount += item.cost;
                    } else {
                      unpaidAmount += item.cost;
                    }
                  });

                  return {
                    ...user,
                    paidAmount,
                    unpaidAmount,
                  };
                }
                return user;
              }),
            };
            setReferralSummary(updatedSummary);
          }
        }
      } else {
        if (costDetails[costType]) {
          const updatedDetails = costDetails[costType].map((item) =>
            item.id === id ? { ...item, paymentStatus: newStatus } : item
          );
          setCostDetails({ ...costDetails, [costType]: updatedDetails });
        }
      }

      const response = await fetchWithTimeout(
        `http://petback.hysu.kr/back/costs/${costType}/${id}/payment-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentStatus: newStatus }),
        },
        10000
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`상태 변경 실패: ${response.status} - ${errorText}`);
      }

      if (costType === "referral") {
        await Promise.all([
          fetchReferralSummary(),
          expandedReferralUser
            ? fetchReferralDetails(expandedReferralUser)
            : Promise.resolve(),
        ]);
      } else {
        await fetchCostDetails(costType);
      }

      await fetchPaymentStatistics();
    } catch (error) {
      console.error("❌ 지급 상태 변경 실패:", error);

      setCostDetails(previousCostDetails);
      if (previousReferralSummary) {
        setReferralSummary(previousReferralSummary);
      }

      if (costType === "referral") {
        if (expandedReferralUser) {
          await fetchReferralDetails(expandedReferralUser);
        }
        await fetchReferralSummary();
      } else {
        await fetchCostDetails(costType);
      }

      alert(
        `지급 상태 변경에 실패했습니다.\n${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setUpdatingPaymentStatus((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
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
        if (costType === "referral") {
          await fetchReferralSummary();
          if (expandedReferralUser) {
            await fetchReferralDetails(expandedReferralUser);
          }
        } else {
          await fetchCostDetails(costType);
        }
        await fetchPaymentStatistics();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete cost:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCopyAccount = (bankName: string, accountNumber: string) => {
    const textToCopy = `${bankName} ${accountNumber}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("계좌번호가 복사되었습니다!");
      })
      .catch((err) => {
        console.error("복사 실패:", err);
        alert("복사에 실패했습니다.");
      });
  };

  const getChartData = () => {
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

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-orange-500 rounded"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              지급 필요 금액
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              * 현재 월({new Date().getMonth() + 1}월) 비용만 표시됩니다
            </p>
          </div>
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

      {/* 차트 */}
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
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredPaymentData.map((item, index) => (
                    <React.Fragment key={`${item.costType}-${index}`}>
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
                            {item.costType === "referral" ? (
                              referralSummary ? (
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                          이름
                                        </th>
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                          계좌정보
                                        </th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                          총 추천비
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          추천 수
                                        </th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                          지급 완료
                                        </th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                          미지급
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          상세
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {referralSummary.costs.map((user) => (
                                        <React.Fragment key={user.userId}>
                                          <tr className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-2 px-4 text-sm">
                                              {user.userName}
                                            </td>
                                            <td className="py-2 px-4 text-sm">
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-700">
                                                  {user.bankName}
                                                </span>
                                                {user.accountNumber &&
                                                  user.accountNumber !==
                                                    "미등록" && (
                                                    <>
                                                      <span className="text-gray-400">
                                                        |
                                                      </span>
                                                      <span className="font-mono text-gray-900">
                                                        {user.accountNumber}
                                                      </span>
                                                      <button
                                                        onClick={() =>
                                                          handleCopyAccount(
                                                            user.bankName,
                                                            user.accountNumber
                                                          )
                                                        }
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                        title="복사"
                                                      >
                                                        📋
                                                      </button>
                                                    </>
                                                  )}
                                                {(!user.accountNumber ||
                                                  user.accountNumber ===
                                                    "미등록") && (
                                                  <span className="text-red-500 text-xs">
                                                    미등록
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-2 px-4 text-sm text-right font-semibold">
                                              {user.totalReferralCost.toLocaleString()}
                                              원
                                            </td>
                                            <td className="py-2 px-4 text-sm text-center">
                                              {user.referralCount}명
                                            </td>
                                            <td className="py-2 px-4 text-sm text-right">
                                              <span className="text-green-700 font-semibold">
                                                {user.paidAmount.toLocaleString()}
                                                원
                                              </span>
                                            </td>
                                            <td className="py-2 px-4 text-sm text-right">
                                              <span className="text-red-700 font-semibold">
                                                {user.unpaidAmount.toLocaleString()}
                                                원
                                              </span>
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              <button
                                                onClick={() =>
                                                  handleReferralUserClick(
                                                    user.userId
                                                  )
                                                }
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                              >
                                                {expandedReferralUser ===
                                                user.userId ? (
                                                  <FaChevronUp className="inline" />
                                                ) : (
                                                  <FaChevronDown className="inline" />
                                                )}
                                              </button>
                                            </td>
                                          </tr>

                                          {expandedReferralUser ===
                                            user.userId && (
                                            <tr>
                                              <td
                                                colSpan={7}
                                                className="bg-blue-50 p-3"
                                              >
                                                {detailsLoading[
                                                  `referral-${user.userId}`
                                                ] ? (
                                                  <div className="text-center py-2 text-gray-400">
                                                    로딩 중...
                                                  </div>
                                                ) : (
                                                  <table className="w-full">
                                                    <thead>
                                                      <tr className="bg-blue-100">
                                                        <th className="text-left py-1 px-3 text-xs font-semibold text-gray-700">
                                                          하위심사원
                                                        </th>
                                                        <th className="text-right py-1 px-3 text-xs font-semibold text-gray-700">
                                                          추천비
                                                        </th>
                                                        <th className="text-center py-1 px-3 text-xs font-semibold text-gray-700">
                                                          생성일
                                                        </th>
                                                        <th className="text-center py-1 px-3 text-xs font-semibold text-gray-700">
                                                          지급 상태
                                                        </th>
                                                        <th className="text-center py-1 px-3 text-xs font-semibold text-gray-700">
                                                          삭제
                                                        </th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {costDetails[
                                                        `referral-${user.userId}`
                                                      ]?.map((detail) => (
                                                        <tr
                                                          key={detail.id}
                                                          className="border-b border-blue-200 hover:bg-blue-100"
                                                        >
                                                          <td className="py-1 px-3 text-xs">
                                                            {
                                                              detail.referredUserName
                                                            }
                                                          </td>
                                                          <td className="py-1 px-3 text-xs text-right">
                                                            {editingCostId ===
                                                            detail.id ? (
                                                              <div className="flex items-center justify-end gap-1">
                                                                <input
                                                                  type="number"
                                                                  value={
                                                                    editingCostValue
                                                                  }
                                                                  onChange={(
                                                                    e
                                                                  ) =>
                                                                    setEditingCostValue(
                                                                      e.target
                                                                        .value
                                                                    )
                                                                  }
                                                                  className="w-20 px-1 py-0.5 border border-blue-400 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                  autoFocus
                                                                />
                                                                <button
                                                                  onClick={() =>
                                                                    handleSaveCost(
                                                                      "referral",
                                                                      detail.id,
                                                                      detail.userId
                                                                    )
                                                                  }
                                                                  className="text-green-600 hover:text-green-800 p-0.5"
                                                                  title="저장"
                                                                >
                                                                  <FaCheck className="text-xs" />
                                                                </button>
                                                                <button
                                                                  onClick={
                                                                    handleCancelEditCost
                                                                  }
                                                                  className="text-gray-600 hover:text-gray-800 p-0.5"
                                                                  title="취소"
                                                                >
                                                                  ✕
                                                                </button>
                                                              </div>
                                                            ) : (
                                                              <span
                                                                onClick={() =>
                                                                  handleStartEditCost(
                                                                    detail.id,
                                                                    detail.cost
                                                                  )
                                                                }
                                                                className="cursor-pointer hover:text-blue-600 hover:underline"
                                                                title="클릭하여 수정"
                                                              >
                                                                {detail.cost.toLocaleString()}
                                                                원
                                                              </span>
                                                            )}
                                                          </td>
                                                          <td className="py-1 px-3 text-xs text-center">
                                                            {new Date(
                                                              detail.createdat
                                                            ).toLocaleDateString(
                                                              "ko-KR"
                                                            )}
                                                          </td>
                                                          <td className="py-1 px-3 text-center">
                                                            <label className="inline-flex items-center cursor-pointer">
                                                              <input
                                                                type="checkbox"
                                                                checked={
                                                                  detail.paymentStatus ===
                                                                  "지급"
                                                                }
                                                                onChange={(e) =>
                                                                  handlePaymentStatusChange(
                                                                    "referral",
                                                                    detail.id,
                                                                    e.target
                                                                      .checked
                                                                      ? "지급"
                                                                      : "미지급"
                                                                  )
                                                                }
                                                                disabled={
                                                                  updatingPaymentStatus[
                                                                    detail.id
                                                                  ]
                                                                }
                                                                className="sr-only peer"
                                                              />
                                                              <div
                                                                className={`relative w-8 h-4 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500 ${
                                                                  updatingPaymentStatus[
                                                                    detail.id
                                                                  ]
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                                }`}
                                                              ></div>
                                                            </label>
                                                          </td>
                                                          <td className="py-1 px-3 text-center">
                                                            <button
                                                              onClick={() =>
                                                                handleDeleteCost(
                                                                  "referral",
                                                                  detail.id,
                                                                  detail.userName
                                                                )
                                                              }
                                                              className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                              title="삭제"
                                                            >
                                                              <FaTrash className="inline text-xs" />
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                )}
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-400">
                                  추천비 데이터가 없습니다.
                                </div>
                              )
                            ) : detailsLoading[item.costType] ? (
                              <div className="text-center py-4 text-gray-400">
                                로딩 중...
                              </div>
                            ) : (
                              <div className="max-h-96 overflow-y-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                        이름
                                      </th>
                                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                        계좌정보
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
                                            {detail.userName}
                                          </td>

                                          <td className="py-2 px-4 text-sm">
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-700">
                                                {detail.bankName || "미등록"}
                                              </span>
                                              {detail.accountNumber &&
                                                detail.accountNumber !==
                                                  "미등록" && (
                                                  <>
                                                    <span className="text-gray-400">
                                                      |
                                                    </span>
                                                    <span className="font-mono text-gray-900">
                                                      {detail.accountNumber}
                                                    </span>
                                                    <button
                                                      onClick={() =>
                                                        handleCopyAccount(
                                                          detail.bankName,
                                                          detail.accountNumber
                                                        )
                                                      }
                                                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                                                      title="복사"
                                                    >
                                                      📋
                                                    </button>
                                                  </>
                                                )}
                                              {(!detail.accountNumber ||
                                                detail.accountNumber ===
                                                  "미등록") && (
                                                <span className="text-red-500 text-xs">
                                                  미등록
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          <td className="py-2 px-4 text-sm text-right">
                                            {editingCostId === detail.id ? (
                                              <div className="flex items-center justify-end gap-2">
                                                <input
                                                  type="number"
                                                  value={editingCostValue}
                                                  onChange={(e) =>
                                                    setEditingCostValue(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="w-28 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                  autoFocus
                                                />
                                                <button
                                                  onClick={() =>
                                                    handleSaveCost(
                                                      item.costType,
                                                      detail.id,
                                                      detail.userId
                                                    )
                                                  }
                                                  className="text-green-600 hover:text-green-800 p-1"
                                                  title="저장"
                                                >
                                                  <FaCheck className="inline" />
                                                </button>
                                                <button
                                                  onClick={handleCancelEditCost}
                                                  className="text-gray-600 hover:text-gray-800 p-1"
                                                  title="취소"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ) : (
                                              <span
                                                onClick={() =>
                                                  handleStartEditCost(
                                                    detail.id,
                                                    detail.cost
                                                  )
                                                }
                                                className="cursor-pointer hover:text-blue-600 hover:underline"
                                                title="클릭하여 수정"
                                              >
                                                {detail.cost.toLocaleString()}원
                                              </span>
                                            )}
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
                                                disabled={
                                                  updatingPaymentStatus[
                                                    detail.id
                                                  ]
                                                }
                                                className="sr-only peer"
                                              />
                                              <div
                                                className={`relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${
                                                  updatingPaymentStatus[
                                                    detail.id
                                                  ]
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                                }`}
                                              ></div>
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
                    <td className="py-4 px-6 font-bold text-gray-900">합계</td>
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

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>
              📌 현재 월({new Date().getMonth() + 1}월) 비용만 표시 | 과거
              데이터는 "정산 히스토리"에서 확인 | 매월 말 스냅샷 반드시 생성!
            </p>
            <p>* 매월 말일 마감 후 익월 10일 지급</p>
          </div>
        </div>
      </div>
    </div>
  );
}
